import { FastifyPluginAsync } from "fastify";
import { withTenantDb } from "@/lib/db/tenant";
import { membershipPlans, memberships } from "@/lib/db/schema";
import { authenticateSession, requireRole } from "../middleware/auth";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const createPlanSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.string().min(1),
  durationDays: z.number().int().positive(),
});

const updatePlanSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.string().min(1).optional(),
  durationDays: z.number().int().positive().optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

export const planRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authenticateSession);

  // 1. List plans for tenant
  fastify.get("/", { preHandler: [requireRole("admin", "staff")] }, async (request, reply) => {
    const session = request.sessionUser!;

    const result = await withTenantDb(session, async (tx) => {
      const [plans, activeMemberships] = await Promise.all([
        tx
          .select()
          .from(membershipPlans)
          .where(and(eq(membershipPlans.tenantId, session.tenantId!), eq(membershipPlans.isActive, "true")))
          .orderBy(desc(membershipPlans.createdAt)),
        tx
          .select()
          .from(memberships)
          .where(and(eq(memberships.tenantId, session.tenantId!), eq(memberships.status, "active"))),
      ]);

      return { plans, memberships: activeMemberships };
    });

    return reply.send(result);
  });

  // 2. Create membership plan
  fastify.post<{ Body: unknown }>("/", { preHandler: [requireRole("admin")] }, async (request, reply) => {
    const session = request.sessionUser!;
    const parseResult = createPlanSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.format(),
      });
    }

    const input = parseResult.data;

    const result = await withTenantDb(session, async (tx) => {
      const [newPlan] = await tx
        .insert(membershipPlans)
        .values({
          tenantId: session.tenantId!,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          price: input.price.trim(),
          durationDays: input.durationDays,
          isActive: "true",
        })
        .returning();

      return { success: true, plan: newPlan };
    });

    return reply.status(201).send(result);
  });

  // 3. Update membership plan
  fastify.patch<{ Params: { id: string }; Body: unknown }>("/:id", { preHandler: [requireRole("admin")] }, async (request, reply) => {
    const session = request.sessionUser!;
    const { id } = request.params;
    const parseResult = updatePlanSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.format(),
      });
    }

    const input = parseResult.data;

    const result = await withTenantDb(session, async (tx) => {
      const [updated] = await tx
        .update(membershipPlans)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(and(eq(membershipPlans.id, id), eq(membershipPlans.tenantId, session.tenantId!)))
        .returning();

      if (!updated) {
        throw new Error("Plan not found or unauthorized");
      }

      return { success: true, plan: updated };
    });

    return reply.send(result);
  });

  // 4. Delete / Archive membership plan
  fastify.delete<{ Params: { id: string } }>("/:id", { preHandler: [requireRole("admin")] }, async (request, reply) => {
    const session = request.sessionUser!;
    const { id } = request.params;

    const result = await withTenantDb(session, async (tx) => {
      // Soft-delete / deactivate so active subscriber histories remain valid
      const [archived] = await tx
        .update(membershipPlans)
        .set({ isActive: "false", updatedAt: new Date() })
        .where(and(eq(membershipPlans.id, id), eq(membershipPlans.tenantId, session.tenantId!)))
        .returning();

      if (!archived) {
        throw new Error("Plan not found or unauthorized");
      }

      return { success: true, message: "Plan archived successfully" };
    });

    return reply.send(result);
  });
};
