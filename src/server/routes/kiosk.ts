import { FastifyPluginAsync } from "fastify";
import { pool } from "@/lib/db";
import { tenants, members, memberships, attendance } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import crypto from "crypto";
import { authenticateSession, requireRole } from "../middleware/auth";
import { z } from "zod";

const db = drizzle(pool);

function generateRotatingToken(tenantId: string, slug: string): { token: string; expiresAt: number; timeRemaining: number } {
  const windowSeconds = 20;
  const now = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(now / windowSeconds);
  const expiresAt = (timeStep + 1) * windowSeconds;
  const timeRemaining = expiresAt - now;

  const secret = process.env.COOKIE_SECRET || "kiosk-turnstile-secret-2026";
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${tenantId}:${slug}:${timeStep}`);
  const signature = hmac.digest("hex").slice(0, 16);

  const token = `GYM:${slug}:${timeStep}:${signature}`;
  return { token, expiresAt: expiresAt * 1000, timeRemaining };
}

function verifyRotatingToken(tokenString: string, tenantId: string, slug: string): boolean {
  if (!tokenString.startsWith("GYM:")) return false;
  const parts = tokenString.split(":");
  if (parts.length !== 4) return false;

  const [_, tokenSlug, stepStr, signature] = parts;
  if (tokenSlug !== slug) return false;

  const tokenStep = parseInt(stepStr, 10);
  const now = Math.floor(Date.now() / 1000);
  const currentStep = Math.floor(now / 20);

  // Accept current step or 1 step prior (grace window of 20 seconds)
  if (tokenStep !== currentStep && tokenStep !== currentStep - 1) {
    return false;
  }

  const secret = process.env.COOKIE_SECRET || "kiosk-turnstile-secret-2026";
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${tenantId}:${slug}:${tokenStep}`);
  const expectedSig = hmac.digest("hex").slice(0, 16);

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
}

export const kioskRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Public Kiosk Metadata & Status
  fastify.get<{ Params: { slug: string } }>("/public/:slug", async (request, reply) => {
    const { slug } = request.params;

    const [tenant] = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        logoUrl: tenants.logoUrl,
        status: tenants.status,
      })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (!tenant) {
      return reply.status(404).send({ error: "Gym not found" });
    }

    const sessionCookie = request.cookies[`kiosk_session_${slug}`];
    const isUnlocked = Boolean(sessionCookie && sessionCookie === "unlocked");

    return reply.send({
      tenant,
      isUnlocked,
    });
  });

  // 2. Verify Kiosk Passphrase / PIN
  fastify.post<{ Body: { slug: string; passphrase: string } }>("/verify-pin", async (request, reply) => {
    const { slug, passphrase } = request.body || {};

    if (!slug || !passphrase) {
      return reply.status(400).send({ error: "Missing gym slug or passphrase" });
    }

    const [tenant] = await db
      .select({ id: tenants.id, kioskPassphrase: tenants.kioskPassphrase })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (!tenant) {
      return reply.status(404).send({ error: "Gym not found" });
    }

    const validPassphrase = tenant.kioskPassphrase || "123456";
    if (passphrase.trim() !== validPassphrase.trim()) {
      return reply.status(401).send({ error: "Incorrect passphrase. Please try again." });
    }

    reply.setCookie(`kiosk_session_${slug}`, "unlocked", {
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return reply.send({ success: true });
  });

  // 3. Dynamic Rotating QR Code Token
  fastify.get<{ Params: { slug: string } }>("/qr/:slug", async (request, reply) => {
    const { slug } = request.params;

    const [tenant] = await db
      .select({ id: tenants.id, name: tenants.name })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (!tenant) {
      return reply.status(404).send({ error: "Gym not found" });
    }

    const qrData = generateRotatingToken(tenant.id, slug);

    return reply.send({
      success: true,
      tenantName: tenant.name,
      ...qrData,
    });
  });

  // 4. Member Self-Scan Kiosk QR
  fastify.post<{ Body: { qrData: string; memberSessionToken?: string } }>("/scan", async (request, reply) => {
    const { qrData } = request.body || {};

    if (!qrData || typeof qrData !== "string") {
      return reply.status(400).send({ error: "Invalid QR code payload" });
    }

    // Extract member identity from session cookie or payload
    const memberCookie = request.cookies.__member_session;
    if (!memberCookie) {
      return reply.status(401).send({ error: "Unauthorized: Member session required to check in" });
    }

    let memberId: string;
    try {
      const parsed = JSON.parse(Buffer.from(memberCookie, "base64").toString("utf-8"));
      memberId = parsed.memberId;
    } catch {
      return reply.status(401).send({ error: "Invalid member session" });
    }

    // Load member
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!member) {
      return reply.status(404).send({ error: "Athlete record not found" });
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, member.tenantId))
      .limit(1);

    if (!tenant) {
      return reply.status(404).send({ error: "Gym tenant not found" });
    }

    // Verify rolling QR against tenant
    const isValid = verifyRotatingToken(qrData, tenant.id, tenant.slug);
    if (!isValid) {
      return reply.status(400).send({ error: "QR code expired or invalid. Please point at the live kiosk screen." });
    }

    // Check membership validity
    const activeMemberships = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.memberId, member.id), eq(memberships.status, "active")))
      .limit(1);

    if (activeMemberships.length === 0) {
      return reply.status(403).send({ error: "No active membership pass found. Please renew at the front desk." });
    }

    // Record attendance
    const [attendanceRecord] = await db
      .insert(attendance)
      .values({
        tenantId: tenant.id,
        memberId: member.id,
        method: "qr",
        kioskId: "kiosk_mobile_camera",
      })
      .returning();

    return reply.send({
      success: true,
      mode: "check_in",
      memberName: member.fullName,
      checkedInAt: attendanceRecord.checkedInAt,
      message: `Welcome to ${tenant.name}, ${member.fullName}!`,
    });
  });

  // 5. Lock Kiosk
  fastify.post<{ Body: { slug: string } }>("/lock", async (request, reply) => {
    const { slug } = request.body || {};
    if (slug) {
      reply.clearCookie(`kiosk_session_${slug}`, { path: "/" });
    }
    return reply.send({ success: true });
  });

  // 6. Update Passphrase (Admin only)
  fastify.patch<{ Body: { passphrase: string } }>("/settings", { preHandler: [authenticateSession, requireRole("admin")] }, async (request, reply) => {
    const session = request.sessionUser!;
    const { passphrase } = request.body || {};

    if (!passphrase || passphrase.trim().length < 4) {
      return reply.status(400).send({ error: "Passphrase must be at least 4 characters" });
    }

    await db
      .update(tenants)
      .set({ kioskPassphrase: passphrase.trim(), updatedAt: new Date() })
      .where(eq(tenants.id, session.tenantId!));

    return reply.send({ success: true, message: "Kiosk passphrase updated successfully" });
  });
};
