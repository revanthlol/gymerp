"use server";

import { withTenantDb } from "@/lib/db/tenant";
import { payments, members, memberships, membershipPlans } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { razorpayProvider } from "@/lib/payments/razorpay";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const manualPaymentSchema = z.object({
  memberId: z.string().uuid("Invalid member ID"),
  planId: z.string().uuid().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  methodSubtype: z.enum(["cash", "card", "upi"]).default("cash"),
  notes: z.string().max(250).optional(),
});

export async function recordManualPaymentAction(rawInput: z.infer<typeof manualPaymentSchema>) {
  const session = await getSession();
  if (!session || !session.tenantId || (session.role !== "admin" && session.role !== "staff")) {
    return { success: false, message: "Unauthorized. Staff or Admin permissions required." };
  }

  const parsed = manualPaymentSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const input = parsed.data;

  try {
    return await withTenantDb(session, async (tx) => {
      // 1. Verify member exists in tenant
      const [member] = await tx
        .select()
        .from(members)
        .where(
          and(
            eq(members.id, input.memberId),
            eq(members.tenantId, session.tenantId!)
          )
        )
        .limit(1);

      if (!member) {
        return { success: false, message: "Member not found in current gym" };
      }

      let createdMembershipId: string | null = null;

      // 2. If a plan is selected, create/renew membership
      if (input.planId) {
        const [plan] = await tx
          .select()
          .from(membershipPlans)
          .where(
            and(
              eq(membershipPlans.id, input.planId),
              eq(membershipPlans.tenantId, session.tenantId!)
            )
          )
          .limit(1);

        if (plan) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(startDate.getDate() + plan.durationDays);

          const startDateStr = startDate.toISOString().split("T")[0];
          const endDateStr = endDate.toISOString().split("T")[0];

          const [newMembership] = await tx
            .insert(memberships)
            .values({
              tenantId: session.tenantId!,
              memberId: member.id,
              planId: plan.id,
              startDate: startDateStr,
              endDate: endDateStr,
              status: "active",
            })
            .returning();

          createdMembershipId = newMembership.id;
        }
      }

      // 3. Insert payment ledger row
      const notesFormatted = `Manual [${input.methodSubtype.toUpperCase()}]${
        input.notes ? `: ${input.notes}` : ""
      }`;

      const [record] = await tx
        .insert(payments)
        .values({
          tenantId: session.tenantId!,
          memberId: member.id,
          membershipId: createdMembershipId,
          amount: input.amount.toFixed(2),
          method: "manual",
          status: "paid",
          paidAt: new Date(),
          notes: notesFormatted,
        })
        .returning();

      // 4. Update member status to active
      await tx
        .update(members)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(members.id, member.id));

      revalidatePath("/admin/payments");
      revalidatePath("/admin/members");
      revalidatePath("/admin");

      return {
        success: true,
        paymentId: record.id,
        message: "Payment collected and recorded successfully",
      };
    });
  } catch (err: any) {
    console.error("Failed to record manual payment:", err);
    return { success: false, message: err?.message || "Failed to record payment" };
  }
}

export async function createOnlinePaymentOrderAction(params: {
  memberId: string;
  planId?: string;
  amount: number;
}) {
  const session = await getSession();
  if (!session || !session.tenantId) {
    return { success: false, message: "Unauthorized" };
  }

  if (!razorpayProvider.isConfigured()) {
    return {
      success: false,
      message: "Razorpay payment gateway not configured. Please contact administrator.",
    };
  }

  try {
    return await withTenantDb(session, async (tx) => {
      const [member] = await tx
        .select()
        .from(members)
        .where(
          and(
            eq(members.id, params.memberId),
            eq(members.tenantId, session.tenantId!)
          )
        )
        .limit(1);

      if (!member) {
        return { success: false, message: "Member not found" };
      }

      const receipt = `rcpt_${Date.now()}_${params.memberId.slice(0, 6)}`;
      const amountInPaise = Math.round(params.amount * 100);

      const order = await razorpayProvider.createOrder({
        amountInPaise,
        currency: "INR",
        receipt,
        notes: {
          tenantId: session.tenantId!,
          memberId: member.id,
          planId: params.planId,
        },
      });

      // Record pending payment
      await tx.insert(payments).values({
        tenantId: session.tenantId!,
        memberId: member.id,
        amount: params.amount.toFixed(2),
        method: "razorpay",
        status: "pending",
        razorpayOrderId: order.orderId,
        notes: "Pending Razorpay Checkout",
      });

      return {
        success: true,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: order.keyId,
        memberName: member.fullName,
        memberEmail: member.email,
        memberPhone: member.phone,
      };
    });
  } catch (err: any) {
    console.error("Failed to create online payment order:", err);
    return { success: false, message: err?.message || "Failed to initialize payment gateway" };
  }
}

export async function getTenantPaymentsAction() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    throw new Error("Unauthorized");
  }

  return await withTenantDb(session, async (tx) => {
    // Parallel fetch: transactions and aggregate stats
    const [allPayments, membersList, plansList] = await Promise.all([
      tx
        .select({
          id: payments.id,
          tenantId: payments.tenantId,
          memberId: payments.memberId,
          membershipId: payments.membershipId,
          amount: payments.amount,
          method: payments.method,
          status: payments.status,
          razorpayOrderId: payments.razorpayOrderId,
          razorpayPaymentId: payments.razorpayPaymentId,
          notes: payments.notes,
          paidAt: payments.paidAt,
          createdAt: payments.createdAt,
          memberName: members.fullName,
          memberEmail: members.email,
          memberPhone: members.phone,
        })
        .from(payments)
        .innerJoin(members, eq(payments.memberId, members.id))
        .where(eq(payments.tenantId, session.tenantId!))
        .orderBy(desc(payments.createdAt))
        .limit(100),

      tx
        .select({
          id: members.id,
          fullName: members.fullName,
          email: members.email,
          phone: members.phone,
          status: members.status,
        })
        .from(members)
        .where(eq(members.tenantId, session.tenantId!))
        .orderBy(desc(members.createdAt)),

      tx
        .select({
          id: membershipPlans.id,
          name: membershipPlans.name,
          price: membershipPlans.price,
          durationDays: membershipPlans.durationDays,
        })
        .from(membershipPlans)
        .where(eq(membershipPlans.tenantId, session.tenantId!)),
    ]);

    let totalRevenue = 0;
    let manualRevenue = 0;
    let onlineRevenue = 0;
    let thisMonthRevenue = 0;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    for (const p of allPayments) {
      if (p.status === "paid") {
        const num = Number(p.amount) || 0;
        totalRevenue += num;
        if (p.method === "manual") manualRevenue += num;
        if (p.method === "razorpay") onlineRevenue += num;

        const date = p.paidAt || p.createdAt;
        if (date && date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
          thisMonthRevenue += num;
        }
      }
    }

    return {
      payments: allPayments,
      members: membersList,
      plans: plansList,
      metrics: {
        totalRevenue,
        manualRevenue,
        onlineRevenue,
        thisMonthRevenue,
        totalTransactions: allPayments.length,
      },
    };
  });
}
