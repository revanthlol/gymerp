import { FastifyPluginAsync } from "fastify";
import { withTenantDb } from "@/lib/db/tenant";
import { gymClasses } from "@/lib/db/schema";
import { authenticateSession, requireRole } from "../middleware/auth";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const createClassSchema = z.object({
  name: z.string().min(2),
  trainer: z.string().min(2),
  time: z.string().min(2),
  durationMinutes: z.number().int().positive().optional().default(60),
  dayOfWeek: z.string().optional().default("Daily"),
  location: z.string().optional().default("Main Studio"),
  capacity: z.number().int().positive().optional().default(20),
  category: z.enum(["Strength", "Cardio", "Combat", "Mind & Body"]).optional().default("Strength"),
});

export const classRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authenticateSession);

  // 1. List classes for tenant
  fastify.get("/", { preHandler: [requireRole("admin", "staff")] }, async (request, reply) => {
    const session = request.sessionUser!;

    const result = await withTenantDb(session, async (tx) => {
      const list = await tx
        .select()
        .from(gymClasses)
        .where(and(eq(gymClasses.tenantId, session.tenantId!), eq(gymClasses.isActive, "true")))
        .orderBy(desc(gymClasses.createdAt));

      return { classes: list };
    });

    return reply.send(result);
  });

  // 2. Schedule a new class
  fastify.post<{ Body: unknown }>("/", { preHandler: [requireRole("admin", "staff")] }, async (request, reply) => {
    const session = request.sessionUser!;
    const parseResult = createClassSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.format(),
      });
    }

    const input = parseResult.data;

    const result = await withTenantDb(session, async (tx) => {
      const [newClass] = await tx
        .insert(gymClasses)
        .values({
          tenantId: session.tenantId!,
          name: input.name.trim(),
          trainer: input.trainer.trim(),
          time: input.time.trim(),
          durationMinutes: input.durationMinutes,
          dayOfWeek: input.dayOfWeek,
          location: input.location.trim(),
          capacity: input.capacity,
          bookedCount: 0,
          category: input.category,
          isActive: "true",
        })
        .returning();

      return { success: true, gymClass: newClass };
    });

    return reply.status(201).send(result);
  });

  // 3. Delete class
  fastify.delete<{ Params: { id: string } }>("/:id", { preHandler: [requireRole("admin")] }, async (request, reply) => {
    const session = request.sessionUser!;
    const { id } = request.params;

    await withTenantDb(session, async (tx) => {
      await tx
        .delete(gymClasses)
        .where(and(eq(gymClasses.id, id), eq(gymClasses.tenantId, session.tenantId!)));
    });

    return reply.send({ success: true, message: "Class session deleted" });
  });

  // 4. Adjust booking spot count
  fastify.patch<{ Params: { id: string }; Body: { delta: number } }>(
    "/:id/spots",
    { preHandler: [requireRole("admin", "staff")] },
    async (request, reply) => {
      const session = request.sessionUser!;
      const { id } = request.params;
      const { delta } = request.body || { delta: 1 };

      const result = await withTenantDb(session, async (tx) => {
        const [existing] = await tx
          .select()
          .from(gymClasses)
          .where(and(eq(gymClasses.id, id), eq(gymClasses.tenantId, session.tenantId!)))
          .limit(1);

        if (!existing) {
          return null;
        }

        const newCount = Math.max(0, Math.min(existing.capacity, existing.bookedCount + delta));
        const [updated] = await tx
          .update(gymClasses)
          .set({ bookedCount: newCount, updatedAt: new Date() })
          .where(eq(gymClasses.id, id))
          .returning();

        return updated;
      });

      if (!result) {
        return reply.status(404).send({ error: "Class not found" });
      }

      return reply.send({ success: true, gymClass: result });
    }
  );
};
