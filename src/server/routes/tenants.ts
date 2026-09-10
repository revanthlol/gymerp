import { FastifyPluginAsync } from "fastify";
import { adminAuth } from "@/lib/firebase/admin";
import { withTenantDb } from "@/lib/db/tenant";
import { tenants, users } from "@/lib/db/schema";
import { createTenantSchema } from "@/lib/validations/tenant";
import { authenticateSession, requireRole } from "../middleware/auth";
import { eq, desc } from "drizzle-orm";

export const tenantRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authenticateSession);

  // 1. List all tenants (Platform role only)
  fastify.get("/", { preHandler: [requireRole("platform")] }, async (request, reply) => {
    const session = request.sessionUser!;

    const allTenants = await withTenantDb(
      { userId: session.uid, role: "platform", tenantId: null },
      async (tx) => {
        return await tx.select().from(tenants).orderBy(desc(tenants.createdAt));
      }
    );

    return reply.send({ tenants: allTenants });
  });

  // 2. Provision new tenant gym + tenant admin (Platform role only)
  fastify.post<{ Body: unknown }>("/", { preHandler: [requireRole("platform")] }, async (request, reply) => {
    const session = request.sessionUser!;
    const parseResult = createTenantSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.format(),
      });
    }

    const input = parseResult.data;
    const licenseExpiresAt = new Date();
    licenseExpiresAt.setDate(licenseExpiresAt.getDate() + input.licenseDurationDays);

    const result = await withTenantDb(
      { userId: session.uid, role: "platform", tenantId: null },
      async (tx) => {
        // 1. Insert Tenant Record
        const [newTenant] = await tx
          .insert(tenants)
          .values({
            name: input.name,
            slug: input.slug,
            status: input.initialStatus,
            contactEmail: input.contactEmail,
            phone: input.phone,
            licenseExpiresAt,
          })
          .returning();

        // 2. Create Firebase User
        const tempPassword = `GymInit_${Math.random().toString(36).slice(-8)}!`;
        let fbUid: string;

        try {
          const fbUser = await adminAuth.createUser({
            email: input.contactEmail,
            displayName: input.adminFullName,
            password: tempPassword,
          });
          fbUid = fbUser.uid;
        } catch (err: any) {
          if (err.code === "auth/email-already-exists") {
            const existing = await adminAuth.getUserByEmail(input.contactEmail);
            fbUid = existing.uid;
          } else {
            throw new Error("Failed to create user in Firebase Auth: " + err.message);
          }
        }

        // 3. Set Custom User Claims for Tenant Admin
        await adminAuth.setCustomUserClaims(fbUid, {
          role: "admin",
          tenant_id: newTenant.id,
        });

        // 4. Insert User Record in PostgreSQL
        await tx.insert(users).values({
          firebaseUid: fbUid,
          tenantId: newTenant.id,
          role: "admin",
          email: input.contactEmail,
          fullName: input.adminFullName,
        });

        // 5. Generate Password Reset / Invitation Link
        let inviteLink = "";
        try {
          inviteLink = await adminAuth.generatePasswordResetLink(input.contactEmail);
        } catch {
          const baseUrl =
            process.env.APP_URL ||
            process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
          inviteLink = `${baseUrl}/login`;
        }

        return {
          success: true,
          tenant: newTenant,
          inviteLink,
          tempPassword,
        };
      }
    );

    return reply.status(201).send(result);
  });

  // 3. Toggle/Update Tenant Status (Platform role only)
  fastify.patch<{
    Params: { id: string };
    Body: { status: "active" | "suspended" | "trial" };
  }>("/:id/status", { preHandler: [requireRole("platform")] }, async (request, reply) => {
    const session = request.sessionUser!;
    const { id } = request.params;
    const { status } = request.body || {};

    if (!status || !["active", "suspended", "trial"].includes(status)) {
      return reply.status(400).send({ error: "Invalid status value" });
    }

    await withTenantDb(
      { userId: session.uid, role: "platform", tenantId: null },
      async (tx) => {
        await tx
          .update(tenants)
          .set({ status, updatedAt: new Date() })
          .where(eq(tenants.id, id));

        // Revoke tokens if suspended
        if (status === "suspended") {
          const tenantUsers = await tx
            .select({ firebaseUid: users.firebaseUid })
            .from(users)
            .where(eq(users.tenantId, id));

          await Promise.all(
            tenantUsers.map((u: any) => adminAuth.revokeRefreshTokens(u.firebaseUid).catch(() => null))
          );
        }
      }
    );

    return reply.send({ success: true, tenantId: id, status });
  });
};
