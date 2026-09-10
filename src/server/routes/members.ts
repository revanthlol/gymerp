import { FastifyPluginAsync } from "fastify";
import { withTenantDb } from "@/lib/db/tenant";
import { members, memberships, membershipPlans, attendance } from "@/lib/db/schema";
import { createMemberSchema } from "@/lib/validations/member";
import { authenticateSession, requireRole } from "../middleware/auth";
import { eq, desc, and } from "drizzle-orm";

export const memberRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authenticateSession);

  // 1. List members for tenant with active plan info
  fastify.get("/", { preHandler: [requireRole("admin", "staff")] }, async (request, reply) => {
    const session = request.sessionUser!;

    const result = await withTenantDb(session, async (tx) => {
      const [tenantMembers, tenantPlans] = await Promise.all([
        tx.select().from(members).orderBy(desc(members.createdAt)),
        tx.select().from(membershipPlans).where(eq(membershipPlans.isActive, "true")),
      ]);

      return { members: tenantMembers, plans: tenantPlans };
    });

    return reply.send(result);
  });

  // 2. Register member + assign membership plan
  fastify.post<{ Body: unknown }>("/", { preHandler: [requireRole("admin", "staff")] }, async (request, reply) => {
    const session = request.sessionUser!;
    const parseResult = createMemberSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.format(),
      });
    }

    const input = parseResult.data;

    const result = await withTenantDb(session, async (tx) => {
      // 1. Insert Member
      const [newMember] = await tx
        .insert(members)
        .values({
          tenantId: session.tenantId!,
          fullName: input.fullName,
          email: input.email || null,
          phone: input.phone,
          gender: input.gender,
          dateOfBirth: input.dateOfBirth || null,
          emergencyContact: input.emergencyContact || null,
          status: "active",
        })
        .returning();

      // 2. If plan is selected, create membership
      if (input.planId) {
        const [plan] = await tx
          .select()
          .from(membershipPlans)
          .where(eq(membershipPlans.id, input.planId))
          .limit(1);

        if (plan) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + plan.durationDays);

          await tx.insert(memberships).values({
            tenantId: session.tenantId!,
            memberId: newMember.id,
            planId: plan.id,
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
            status: "active",
          });
        }
      }

      return { success: true, member: newMember };
    });

    return reply.status(201).send(result);
  });

  // 3. Get member check-in activities
  fastify.get<{ Params: { id: string } }>(
    "/:id/activities",
    { preHandler: [requireRole("admin", "staff")] },
    async (request, reply) => {
      const session = request.sessionUser!;
      const { id } = request.params;

      const activities = await withTenantDb(session, async (tx) => {
        return await tx
          .select()
          .from(attendance)
          .where(and(eq(attendance.memberId, id), eq(attendance.tenantId, session.tenantId!)))
          .orderBy(desc(attendance.checkedInAt))
          .limit(20);
      });

      return reply.send({ activities });
    }
  );
};
