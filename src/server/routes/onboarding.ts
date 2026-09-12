import { FastifyPluginAsync } from "fastify";
import { pool } from "@/lib/db";
import { tenants, users, membershipPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { adminAuth } from "@/lib/firebase/admin";
import { authenticateSession, requireRole } from "../middleware/auth";
import { z } from "zod";

const db = drizzle(pool);

export const onboardingRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Setup Password from Admin Invitation
  fastify.post<{ Body: { email: string; password: string } }>("/setup-password", async (request, reply) => {
    const { email, password } = request.body || {};

    if (!email || !password || password.length < 6) {
      return reply.status(400).send({ error: "Valid email and minimum 6-character password required" });
    }

    try {
      const fbUser = await adminAuth.getUserByEmail(email.trim().toLowerCase());
      await adminAuth.updateUser(fbUser.uid, { password });

      return reply.send({
        success: true,
        message: "Password set successfully. You may now log in to your gym admin portal.",
      });
    } catch (err: any) {
      return reply.status(400).send({
        error: "Unable to set password. User not found or link expired.",
        details: err?.message,
      });
    }
  });

  // 2. Complete Onboarding Wizard (Admin role)
  fastify.post<{
    Body: {
      phone?: string;
      planName?: string;
      planPrice?: string;
      planDurationDays?: number;
    };
  }>("/complete", { preHandler: [authenticateSession, requireRole("admin")] }, async (request, reply) => {
    const session = request.sessionUser!;
    const { phone, planName, planPrice, planDurationDays } = request.body || {};

    if (phone) {
      await db
        .update(tenants)
        .set({ phone: phone.trim(), updatedAt: new Date() })
        .where(eq(tenants.id, session.tenantId!));
    }

    if (planName && planPrice) {
      await db.insert(membershipPlans).values({
        tenantId: session.tenantId!,
        name: planName.trim(),
        price: planPrice.trim(),
        durationDays: planDurationDays || 30,
        description: "Initial plan configured during gym onboarding",
        isActive: "true",
      });
    }

    return reply.send({
      success: true,
      message: "Onboarding completed successfully!",
    });
  });
};
