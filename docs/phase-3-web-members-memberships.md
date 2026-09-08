# Phase 3 — Web: Members & Membership Plans

> **Scope:**
> Implement the operational core of GymERP for Gym Admins and Front-Desk Staff: membership plan configuration, member registration, automated QR token generation, subscription lifecycle management, date computation engines, and member profile dossiers.

---

## 1. Role-Based Access Boundary

| Capability | Gym Admin (`admin`) | Front-Desk Staff (`staff`) | Platform Superadmin (`platform`) |
|---|---|---|---|
| Create/Edit Membership Plans | Allowed | **Blocked** (Read-Only) | **Blocked** (0 DB Access via RLS) |
| Add / Edit Members | Allowed | Allowed | **Blocked** (0 DB Access via RLS) |
| Assign Plans / Subscriptions | Allowed | Allowed | **Blocked** (0 DB Access via RLS) |
| Freeze / Cancel Memberships | Allowed | Allowed | **Blocked** (0 DB Access via RLS) |

---

## 2. Membership Plans Management (`/admin/plans`)

### 2.1 Zod Plan Schema (`src/lib/validations/plan.ts`)
```typescript
import { z } from "zod";

export const planSchema = z.object({
  name: z.string().min(2, "Plan name must be at least 2 characters").max(50),
  description: z.string().max(200).optional(),
  price: z.coerce.number().positive("Price must be greater than zero"),
  durationDays: z.coerce.number().int().positive("Duration must be at least 1 day"),
  isActive: z.enum(["true", "false"]).default("true"),
});

export type PlanInput = z.infer<typeof planSchema>;
```

### 2.2 Plan Mutation Server Action (`src/lib/api/plans.ts`)
```typescript
"use server";

import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { membershipPlans } from "@/lib/db/schema";
import { planSchema, PlanInput } from "@/lib/validations/plan";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createPlanAction(rawInput: PlanInput) {
  const session = await getSession();
  if (!session || session.role !== "admin" || !session.tenantId) {
    throw new Error("Unauthorized: Only Gym Admins can configure plans");
  }

  const input = planSchema.parse(rawInput);

  return await withTenantDb(session, async (tx) => {
    const [newPlan] = await tx.insert(membershipPlans).values({
      tenantId: session.tenantId,
      name: input.name,
      description: input.description,
      price: input.price.toString(),
      durationDays: input.durationDays,
      isActive: input.isActive,
    }).returning();

    revalidatePath("/admin/plans");
    return { success: true, plan: newPlan };
  });
}
```

---

## 3. Member Registration & QR Token Generation

Every new member record is automatically assigned a cryptographically unique `qr_token` (UUID v4) stored in the database. This token is encoded as a high-density QR code rendered in the member's profile for kiosk check-ins.

### 3.1 Zod Member Schema (`src/lib/validations/member.ts`)
```typescript
import { z } from "zod";

export const memberSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100),
  phone: z.string().min(8, "Valid phone number required").max(20),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.string().optional(), // YYYY-MM-DD
  emergencyContact: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  planId: z.string().uuid("Please select an initial membership plan"),
  startDate: z.string().default(() => new Date().toISOString().split("T")[0]),
});

export type MemberInput = z.infer<typeof memberSchema>;
```

### 3.2 Member Creation & Subscription Atomic Transaction (`src/lib/api/members.ts`)
```typescript
"use server";

import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { members, memberships, membershipPlans } from "@/lib/db/schema";
import { memberSchema, MemberInput } from "@/lib/validations/member";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createMemberAction(rawInput: MemberInput) {
  const session = await getSession();
  if (!session || !session.tenantId || (session.role !== "admin" && session.role !== "staff")) {
    throw new Error("Unauthorized");
  }

  const input = memberSchema.parse(rawInput);

  return await withTenantDb(session, async (tx) => {
    // 1. Fetch selected plan to obtain durationDays
    const [plan] = await tx.select()
      .from(membershipPlans)
      .where(and(
        eq(membershipPlans.id, input.planId),
        eq(membershipPlans.tenantId, session.tenantId)
      ))
      .limit(1);

    if (!plan) throw new Error("Selected membership plan not found");

    // 2. Compute End Date
    const start = new Date(input.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + plan.durationDays);
    const endDateStr = end.toISOString().split("T")[0];

    // 3. Insert Member Record (generates qr_token automatically via schema defaultRandom)
    const [newMember] = await tx.insert(members).values({
      tenantId: session.tenantId,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email || null,
      gender: input.gender || null,
      dateOfBirth: input.dateOfBirth || null,
      emergencyContact: input.emergencyContact || null,
      avatarUrl: input.avatarUrl || null,
      status: "active",
      joinDate: input.startDate,
    }).returning();

    // 4. Insert Membership Subscription Record
    const [newMembership] = await tx.insert(memberships).values({
      tenantId: session.tenantId,
      memberId: newMember.id,
      planId: plan.id,
      startDate: input.startDate,
      endDate: endDateStr,
      status: "active",
    }).returning();

    revalidatePath("/admin/members");
    revalidatePath("/staff");

    return {
      success: true,
      member: newMember,
      membership: newMembership,
    };
  });
}
```

---

## 4. Member Dossier & QR Code Presentation

### 4.1 Digital Member ID Card
The member dossier component renders:
- **Profile Header**: Avatar, Full Name, Phone, Join Date.
- **Membership Status Badge**:
  - `Active` (Green): `endDate >= today`
  - `Expiring Soon` (Amber): `endDate <= today + 5 days`
  - `Expired` (Red): `endDate < today`
- **QR Pass Display**: Rendered with `@react-qr/core` or `qrcode.react` using the member's `qr_token`. Can be scanned by the check-in kiosk camera.
- **Quick Action Bar**: One-click WhatsApp link (`https://wa.me/{cleanPhone}`), phone call dialer, and manual renew trigger.

---

## 5. Phase 3 Exit Criteria

- [ ] Gym Admin can create, edit, and deactivate membership plans.
- [ ] Database RLS policy blocks Staff role from modifying plan pricing (verified with automated test).
- [ ] Staff and Admin can register members; member record is created with a unique `qr_token`.
- [ ] Membership `endDate` is automatically and accurately computed from `startDate + plan.durationDays`.
- [ ] Member directory `<DataTable>` displays live members with instant search by name and phone.
- [ ] Member drawer renders readable, scannable QR code matching member's `qr_token`.
