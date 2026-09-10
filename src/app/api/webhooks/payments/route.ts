import { NextRequest, NextResponse } from "next/server";
import { razorpayProvider } from "@/lib/payments/razorpay";
import { db } from "@/lib/db";
import { payments, memberships, members } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    // Verify HMAC-SHA256 signature
    const isValid = razorpayProvider.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error("[CRITICAL] Forged or invalid Razorpay webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      if (!paymentEntity) {
        return NextResponse.json({ error: "No payment entity found in webhook payload" }, { status: 400 });
      }

      const notes = paymentEntity.notes || {};
      const { tenantId, memberId, membershipId } = notes;

      if (!tenantId || !memberId) {
        console.warn("[WEBHOOK] Missing tenantId or memberId in Razorpay notes:", notes);
        return NextResponse.json(
          { error: "Missing tenant or member context in order notes" },
          { status: 400 }
        );
      }

      const amountInRupees = (Number(paymentEntity.amount) / 100).toFixed(2);
      const razorpayPaymentId = paymentEntity.id;
      const razorpayOrderId = paymentEntity.order_id || null;

      await db.transaction(async (tx) => {
        // Idempotency check: check if this payment was already recorded
        const [existing] = await tx
          .select()
          .from(payments)
          .where(
            razorpayPaymentId
              ? eq(payments.razorpayPaymentId, razorpayPaymentId)
              : and(
                  eq(payments.tenantId, tenantId),
                  eq(payments.razorpayOrderId, razorpayOrderId)
                )
          )
          .limit(1);

        if (existing) {
          if (existing.status !== "paid") {
            await tx
              .update(payments)
              .set({
                status: "paid",
                razorpayPaymentId,
                paidAt: new Date(),
                notes: `Captured via webhook. Method: ${paymentEntity.method || "card/upi"}`,
              })
              .where(eq(payments.id, existing.id));
          }
        } else {
          await tx.insert(payments).values({
            tenantId,
            memberId,
            membershipId: membershipId || null,
            amount: amountInRupees,
            method: "razorpay",
            status: "paid",
            razorpayOrderId,
            razorpayPaymentId,
            notes: `Online: ${paymentEntity.method || "card/upi"} - ${paymentEntity.description || "Checkout"}`,
            paidAt: new Date(),
          });
        }

        // Activate membership if linked
        if (membershipId) {
          await tx
            .update(memberships)
            .set({ status: "active" })
            .where(
              and(
                eq(memberships.id, membershipId),
                eq(memberships.tenantId, tenantId)
              )
            );
        }

        // Set member status to active
        await tx
          .update(members)
          .set({ status: "active" })
          .where(
            and(
              eq(members.id, memberId),
              eq(members.tenantId, tenantId)
            )
          );
      });

      return NextResponse.json({ status: "processed", paymentId: razorpayPaymentId });
    }

    if (eventType === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      if (paymentEntity) {
        const notes = paymentEntity.notes || {};
        const { tenantId, memberId, membershipId } = notes;

        if (tenantId && memberId) {
          const amountInRupees = (Number(paymentEntity.amount) / 100).toFixed(2);
          await db.insert(payments).values({
            tenantId,
            memberId,
            membershipId: membershipId || null,
            amount: amountInRupees,
            method: "razorpay",
            status: "failed",
            razorpayOrderId: paymentEntity.order_id || null,
            razorpayPaymentId: paymentEntity.id || null,
            notes: `Failed: ${paymentEntity.error_description || "Declined"}`,
          });
        }
      }
      return NextResponse.json({ status: "recorded_failure" });
    }

    // Default acknowledgement for other events
    return NextResponse.json({ status: "ignored", event: eventType });
  } catch (err: any) {
    console.error("[CRITICAL] Payment webhook error:", err);
    return NextResponse.json(
      { error: "Internal server error processing payment webhook" },
      { status: 500 }
    );
  }
}
