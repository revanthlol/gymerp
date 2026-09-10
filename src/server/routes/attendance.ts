import { FastifyPluginAsync } from "fastify";
import { withTenantDb } from "@/lib/db/tenant";
import { members, attendance } from "@/lib/db/schema";
import { generateGymRotatingQr, verifyGymRotatingQr } from "@/lib/attendance/qr";
import { authenticateSession, requireRole } from "../middleware/auth";
import { eq, desc, and, gte } from "drizzle-orm";

export const attendanceRoutes: FastifyPluginAsync = async (fastify) => {
  // All attendance routes require an authenticated session (admin or staff)
  fastify.addHook("preHandler", authenticateSession);

  // 1. Get current rotating turnstile QR code
  fastify.get("/qr", { preHandler: [requireRole("admin", "staff")] }, async (request, reply) => {
    const session = request.sessionUser!;
    const qrData = await generateGymRotatingQr(session.tenantId!);
    return reply.send(qrData);
  });

  // 2. High-speed Turnstile QR scan check-in
  fastify.post<{
    Body: { memberId: string; qrToken: string; kioskId?: string };
  }>("/scan", { preHandler: [requireRole("admin", "staff")] }, async (request, reply) => {
    const { memberId, qrToken, kioskId } = request.body || {};
    const session = request.sessionUser!;

    if (!memberId || !qrToken) {
      return reply.status(400).send({
        success: false,
        message: "Missing memberId or qrToken",
      });
    }

    // Dynamic 2-hour rotating QR token verification
    const verification = verifyGymRotatingQr(session.tenantId!, qrToken);
    if (!verification.valid) {
      return reply.status(400).send({
        success: false,
        message: verification.reason || "Check-in QR code expired. Please scan current code.",
      });
    }

    const result = await withTenantDb(session, async (tx) => {
      // 1. Single-use replay protection
      if (verification.nonce) {
        const [alreadyConsumed] = await tx
          .select()
          .from(attendance)
          .where(
            and(
              eq(attendance.tenantId, session.tenantId!),
              eq(attendance.kioskId, `qr:${verification.nonce}`)
            )
          )
          .limit(1);

        if (alreadyConsumed) {
          return {
            success: false,
            duplicate: true,
            message: "Single-use QR code already consumed. Please scan the current code on screen.",
          };
        }
      }

      // Look up member in active tenant
      const [member] = await tx
        .select()
        .from(members)
        .where(and(eq(members.id, memberId), eq(members.tenantId, session.tenantId!)))
        .limit(1);

      if (!member) {
        return { success: false, message: "Member record not found" };
      }

      if (member.status !== "active") {
        return {
          success: false,
          message: `Membership status is ${member.status.toUpperCase()}. Please renew.`,
        };
      }

      // Anti-Passback check: prevent double-tapping within 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentCheckIns = await tx
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.memberId, member.id),
            gte(attendance.checkedInAt, tenMinutesAgo)
          )
        )
        .limit(1);

      if (recentCheckIns.length > 0) {
        return {
          success: false,
          duplicate: true,
          memberName: member.fullName,
          message: "Already checked in (<10 min ago). Anti-passback active.",
        };
      }

      // Record attendance entry & burn nonce
      const [newCheckIn] = await tx
        .insert(attendance)
        .values({
          tenantId: session.tenantId!,
          memberId: member.id,
          method: "qr_scan",
          kioskId: verification.nonce ? `qr:${verification.nonce}` : (kioskId || "kiosk-front-01"),
        })
        .returning();

      return {
        success: true,
        memberName: member.fullName,
        checkedInAt: newCheckIn.checkedInAt,
        message: "Access Granted · Welcome!",
      };
    });

    return reply.status(result.success ? 200 : 400).send(result);
  });

  // 3. Staff manual check-in
  fastify.post<{ Body: { memberId: string } }>(
    "/manual",
    { preHandler: [requireRole("admin", "staff")] },
    async (request, reply) => {
      const { memberId } = request.body || {};
      const session = request.sessionUser!;

      if (!memberId) {
        return reply.status(400).send({ success: false, message: "Missing memberId" });
      }

      const result = await withTenantDb(session, async (tx) => {
        const [member] = await tx
          .select()
          .from(members)
          .where(and(eq(members.id, memberId), eq(members.tenantId, session.tenantId!)))
          .limit(1);

        if (!member) {
          return { success: false, message: "Member record not found" };
        }

        if (member.status !== "active") {
          return {
            success: false,
            message: `Member status is ${member.status.toUpperCase()}`,
          };
        }

        const [newCheckIn] = await tx
          .insert(attendance)
          .values({
            tenantId: session.tenantId!,
            memberId: member.id,
            method: "manual",
            kioskId: "front-desk-manual",
          })
          .returning();

        return {
          success: true,
          memberName: member.fullName,
          checkedInAt: newCheckIn.checkedInAt,
          message: "Manual Check-In Confirmed",
        };
      });

      return reply.status(result.success ? 200 : 400).send(result);
    }
  );

  // 4. List attendance with joined member info (single-query high performance)
  fastify.get<{ Querystring: { limit?: string } }>(
    "/",
    { preHandler: [requireRole("admin", "staff")] },
    async (request, reply) => {
      const session = request.sessionUser!;
      const limit = Math.min(parseInt(request.query.limit || "50", 10), 200);

      const records = await withTenantDb(session, async (tx) => {
        return await tx
          .select({
            id: attendance.id,
            memberId: attendance.memberId,
            memberName: members.fullName,
            memberPhone: members.phone,
            method: attendance.method,
            kioskId: attendance.kioskId,
            checkedInAt: attendance.checkedInAt,
          })
          .from(attendance)
          .leftJoin(members, eq(attendance.memberId, members.id))
          .orderBy(desc(attendance.checkedInAt))
          .limit(limit);
      });

      return reply.send({ attendance: records });
    }
  );
};
