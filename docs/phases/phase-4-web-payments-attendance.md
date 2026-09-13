# Phase 4 — Web: Payments, Webhooks & Attendance Kiosk

> **Scope:**
> Deliver financial settlement workflows (manual cash/card collection & Razorpay online checkout with HMAC webhook verification) and the operational front-desk kiosk (browser-camera QR scanner, attendance log, audio feedback, duplicate throttling, and offline IndexedDB sync).

---

## 1. Payment Processing Architecture

Payments are abstracted behind a unified `PaymentProvider` interface to decouple business logic from the gateway:

```typescript
// src/lib/payments/types.ts
export interface CreateOrderParams {
  amountInCents: number; // or paise (smallest currency unit)
  currency: string;
  receipt: string;
  notes: {
    tenantId: string;
    memberId: string;
    membershipId?: string;
  };
}

export interface PaymentProvider {
  createOrder(params: CreateOrderParams): Promise<{ orderId: string; amount: number }>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}
```

---

## 2. Razorpay Webhook Route Handler (`/api/webhooks/payments/route.ts`)

Webhooks are the **single source of truth** for online payments. Client-side payment confirmation is never trusted directly.

```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { payments, memberships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
    }

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("CRITICAL: Forged webhook signature detected");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const paymentEntity = event.payload.payment.entity;
      const notes = paymentEntity.notes || {};
      const { tenantId, memberId, membershipId } = notes;

      if (!tenantId || !memberId) {
        return NextResponse.json({ error: "Missing tenant or member context in notes" }, { status: 400 });
      }

      await db.transaction(async (tx) => {
        // Record payment row
        await tx.insert(payments).values({
          tenantId,
          memberId,
          membershipId: membershipId || null,
          amount: (paymentEntity.amount / 100).toString(),
          method: "razorpay",
          status: "paid",
          razorpayPaymentId: paymentEntity.id,
          razorpayOrderId: paymentEntity.order_id,
          paidAt: new Date(),
          notes: `Razorpay Online: ${paymentEntity.method}`,
        });

        // If linked to membership, ensure status is marked active
        if (membershipId) {
          await tx.update(memberships)
            .set({ status: "active" })
            .where(eq(memberships.id, membershipId));
        }
      });
    }

    return NextResponse.json({ status: "processed" });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

## 3. Manual Cash/POS Payment Collection (`src/lib/api/payments.ts`)

Front-desk staff or gym admins can log physical cash or front-desk POS card transactions:

```typescript
"use server";

import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { payments } from "@/lib/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const manualPaymentSchema = z.object({
  memberId: z.string().uuid(),
  membershipId: z.string().uuid().optional(),
  amount: z.coerce.number().positive(),
  notes: z.string().max(200).optional(),
});

export async function recordManualPaymentAction(rawInput: z.infer<typeof manualPaymentSchema>) {
  const session = await getSession();
  if (!session || !session.tenantId || (session.role !== "admin" && session.role !== "staff")) {
    throw new Error("Unauthorized");
  }

  const input = manualPaymentSchema.parse(rawInput);

  return await withTenantDb(session, async (tx) => {
    const [record] = await tx.insert(payments).values({
      tenantId: session.tenantId,
      memberId: input.memberId,
      membershipId: input.membershipId || null,
      amount: input.amount.toString(),
      method: "manual",
      status: "paid",
      paidAt: new Date(),
      notes: input.notes || "Front-desk cash settlement",
    }).returning();

    revalidatePath("/admin/finance");
    return { success: true, payment: record };
  });
}
```

---

## 4. Attendance Kiosk & QR Scanner (`/staff/kiosk`)

The check-in kiosk runs on tablets or phones mounted at the gym front desk.

### 4.1 Check-In Business Logic & Anti-Duplication Throttling
```typescript
"use server";

import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { members, memberships, attendance } from "@/lib/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";

export async function processQrCheckinAction(qrToken: string) {
  const session = await getSession();
  if (!session || !session.tenantId) throw new Error("Unauthorized");

  return await withTenantDb(session, async (tx) => {
    // 1. Locate member by qrToken within this tenant
    const [member] = await tx.select()
      .from(members)
      .where(and(
        eq(members.qrToken, qrToken),
        eq(members.tenantId, session.tenantId)
      ))
      .limit(1);

    if (!member) {
      return { status: "NOT_FOUND", message: "Invalid or unrecognized pass" };
    }

    if (member.status === "frozen") {
      return { status: "FROZEN", message: "Membership is frozen", member };
    }

    // 2. Locate active membership
    const [activeMembership] = await tx.select()
      .from(memberships)
      .where(and(
        eq(memberships.memberId, member.id),
        eq(memberships.tenantId, session.tenantId),
        eq(memberships.status, "active")
      ))
      .limit(1);

    const today = new Date().toISOString().split("T")[0];
    const isExpired = !activeMembership || activeMembership.endDate < today;

    if (isExpired) {
      return {
        status: "EXPIRED",
        message: "Membership plan has expired",
        member,
        endDate: activeMembership?.endDate,
      };
    }

    // 3. Duplicate scan throttling (Block check-ins within last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const [recentAttendance] = await tx.select()
      .from(attendance)
      .where(and(
        eq(attendance.memberId, member.id),
        eq(attendance.tenantId, session.tenantId),
        gte(attendance.checkedInAt, tenMinutesAgo)
      ))
      .limit(1);

    if (recentAttendance) {
      return {
        status: "DUPLICATE",
        message: "Already checked in recently",
        member,
        checkedInAt: recentAttendance.checkedInAt,
      };
    }

    // 4. Record attendance
    const [checkin] = await tx.insert(attendance).values({
      tenantId: session.tenantId,
      memberId: member.id,
      method: "qr",
      checkedInAt: new Date(),
    }).returning();

    return {
      status: "SUCCESS",
      message: "Access granted",
      member,
      planName: "Active Membership",
      checkedInAt: checkin.checkedInAt,
    };
  });
}
```

### 4.2 Offline IndexedDB Sync Pattern
When the front desk loses network connectivity:
1. Scans are saved to IndexedDB (`gymerp_kiosk_db`, store `pending_scans`).
2. UI displays an **Amber "Offline Queue: X Scans"** status indicator.
3. When `window.addEventListener("online")` fires, the queue worker flushes the backlog sequentially to `processQrCheckinAction`.

---

## 5. Phase 4 Exit Criteria

- [ ] Staff can record manual cash/card payments; payment history updates in real-time.
- [ ] Razorpay webhook endpoint correctly verifies HMAC signatures and ignores unsigned/tampered payloads with a 403 response.
- [ ] Valid `payment.captured` webhook writes `payments` row and activates corresponding membership.
- [ ] Kiosk camera reads QR code accurately on mobile/tablet hardware using `html5-qrcode`.
- [ ] Check-in engine blocks expired members with visual alert and audio buzzer.
- [ ] Duplicate check-ins within 10 minutes return `DUPLICATE` without creating redundant database rows.
- [ ] Offline scans queue in IndexedDB and flush automatically upon reconnection.
