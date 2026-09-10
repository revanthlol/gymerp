import { FastifyPluginAsync } from "fastify";
import { withTenantDb } from "@/lib/db/tenant";
import { payments, members, memberships, membershipPlans } from "@/lib/db/schema";
import { authenticateSession, requireRole } from "../middleware/auth";
import { razorpayProvider } from "@/lib/payments/razorpay";
import { eq, desc, and } from "drizzle-orm";

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authenticateSession);

  // 1. Get Payment Ledger & Aggregations
  fastify.get("/ledger", { preHandler: [requireRole("admin", "staff")] }, async (request, reply) => {
    const session = request.sessionUser!;

    const result = await withTenantDb(session, async (tx) => {
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

      for (const p of allPayments) {
        if (p.status === "paid") {
          const num = Number(p.amount) || 0;
          totalRevenue += num;
          if (p.method === "manual") manualRevenue += num;
          if (p.method === "razorpay") onlineRevenue += num;
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
          totalTransactions: allPayments.length,
        },
      };
    });

    return reply.send(result);
  });

  // 2. Record Manual Payment
  fastify.post<{
    Body: {
      memberId: string;
      planId?: string;
      amount: number;
      methodSubtype?: "cash" | "card" | "upi";
      notes?: string;
    };
  }>("/manual", { preHandler: [requireRole("admin", "staff")] }, async (request, reply) => {
    const { memberId, planId, amount, methodSubtype = "cash", notes } = request.body || {};
    const session = request.sessionUser!;

    if (!memberId || !amount || amount <= 0) {
      return reply.status(400).send({ success: false, message: "Valid memberId and positive amount required" });
    }

    const result = await withTenantDb(session, async (tx) => {
      const [member] = await tx
        .select()
        .from(members)
        .where(and(eq(members.id, memberId), eq(members.tenantId, session.tenantId!)))
        .limit(1);

      if (!member) {
        return { success: false, message: "Member not found" };
      }

      let createdMembershipId: string | null = null;

      if (planId) {
        const [plan] = await tx
          .select()
          .from(membershipPlans)
          .where(and(eq(membershipPlans.id, planId), eq(membershipPlans.tenantId, session.tenantId!)))
          .limit(1);

        if (plan) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(startDate.getDate() + plan.durationDays);

          const [newMembership] = await tx
            .insert(memberships)
            .values({
              tenantId: session.tenantId!,
              memberId: member.id,
              planId: plan.id,
              startDate: startDate.toISOString().split("T")[0],
              endDate: endDate.toISOString().split("T")[0],
              status: "active",
            })
            .returning();

          createdMembershipId = newMembership.id;
        }
      }

      const formattedNotes = `Manual [${methodSubtype.toUpperCase()}]${notes ? `: ${notes}` : ""}`;

      const [record] = await tx
        .insert(payments)
        .values({
          tenantId: session.tenantId!,
          memberId: member.id,
          membershipId: createdMembershipId,
          amount: amount.toFixed(2),
          method: "manual",
          status: "paid",
          paidAt: new Date(),
          notes: formattedNotes,
        })
        .returning();

      await tx
        .update(members)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(members.id, member.id));

      return { success: true, paymentId: record.id };
    });

    return reply.send(result);
  });
};
