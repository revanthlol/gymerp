import { FastifyPluginAsync } from "fastify";
import { withTenantDb } from "@/lib/db/tenant";
import { members, membershipPlans, attendance, payments, tenants } from "@/lib/db/schema";
import { authenticateSession, requireRole } from "../middleware/auth";
import { eq, desc, gte } from "drizzle-orm";

export const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authenticateSession);

  // 1. Admin Dashboard Aggregated Metrics (High-Speed Single Trip)
  fastify.get("/admin", { preHandler: [requireRole("admin")] }, async (request, reply) => {
    const session = request.sessionUser!;

    const result = await withTenantDb(session, async (tx) => {
      // Parallel execution inside tenant transaction
      const [allMembers, allPlans, recentAttendance, allPayments] = await Promise.all([
        tx.select({ id: members.id, status: members.status, fullName: members.fullName }).from(members),
        tx.select().from(membershipPlans),
        tx
          .select({
            id: attendance.id,
            memberId: attendance.memberId,
            memberName: members.fullName,
            method: attendance.method,
            kioskId: attendance.kioskId,
            checkedInAt: attendance.checkedInAt,
          })
          .from(attendance)
          .leftJoin(members, eq(attendance.memberId, members.id))
          .orderBy(desc(attendance.checkedInAt))
          .limit(20),
        tx.select({ amount: payments.amount, status: payments.status }).from(payments),
      ]);

      const activeMembers = (allMembers as any[]).filter((m: any) => m.status === "active").length;
      const inactiveMembers = (allMembers as any[]).length - activeMembers;
      const totalRevenue = (allPayments as any[]).reduce(
        (acc: number, p: any) => acc + (p.status === "paid" ? parseFloat(p.amount) : 0),
        0
      );

      return {
        stats: {
          totalMembers: allMembers.length,
          activeMembers,
          inactiveMembers,
          turnstileScans: recentAttendance.length,
          settledRevenue: totalRevenue,
          paymentCount: allPayments.length,
          planCount: allPlans.length,
        },
        plans: allPlans,
        recentAttendance,
      };
    });

    return reply.send(result);
  });

  // 2. Staff Dashboard Aggregated Metrics
  fastify.get("/staff", { preHandler: [requireRole("admin", "staff")] }, async (request, reply) => {
    const session = request.sessionUser!;

    const result = await withTenantDb(session, async (tx) => {
      const [allMembers, recentAttendance] = await Promise.all([
        tx.select({ id: members.id, fullName: members.fullName, phone: members.phone, status: members.status }).from(members),
        tx
          .select({
            id: attendance.id,
            memberId: attendance.memberId,
            memberName: members.fullName,
            method: attendance.method,
            kioskId: attendance.kioskId,
            checkedInAt: attendance.checkedInAt,
          })
          .from(attendance)
          .leftJoin(members, eq(attendance.memberId, members.id))
          .orderBy(desc(attendance.checkedInAt))
          .limit(10),
      ]);

      const activeCount = (allMembers as any[]).filter((m: any) => m.status === "active").length;

      return {
        stats: {
          totalMembers: (allMembers as any[]).length,
          activeMembers: activeCount,
          recentScansCount: recentAttendance.length,
        },
        members: allMembers,
        recentAttendance,
      };
    });

    return reply.send(result);
  });

  // 3. Platform Superadmin Dashboard Aggregated Metrics
  fastify.get("/platform", { preHandler: [requireRole("platform")] }, async (request, reply) => {
    const session = request.sessionUser!;

    const result = await withTenantDb(
      { userId: session.uid, role: "platform", tenantId: null },
      async (tx) => {
        const allTenants = await tx.select().from(tenants).orderBy(desc(tenants.createdAt));

        const activeCount = (allTenants as any[]).filter((t: any) => t.status === "active").length;
        const trialCount = (allTenants as any[]).filter((t: any) => t.status === "trial").length;
        const suspendedCount = (allTenants as any[]).filter((t: any) => t.status === "suspended").length;
        const annualRatePerGym = 1188;
        const platformArr = activeCount * annualRatePerGym;

        return {
          stats: {
            totalTenants: allTenants.length,
            activeCount,
            trialCount,
            suspendedCount,
            platformArr,
          },
          tenants: allTenants,
        };
      }
    );

    return reply.send(result);
  });
};
