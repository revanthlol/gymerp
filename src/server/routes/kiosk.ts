import { FastifyPluginAsync } from "fastify";
import { pool } from "@/lib/db";
import { tenants, members, memberships, attendance, kiosks } from "@/lib/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import crypto from "crypto";
import { verifyMemberToken } from "@/lib/auth/member-session";
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

  // 4. Member Self-Scan Kiosk QR or Backup Station Code
  fastify.post<{
    Body: {
      qrData: string;
      memberUid?: string;
      memberPhone?: string;
      memberSessionToken?: string;
      mode?: "auto" | "entry" | "exit";
    };
  }>("/scan", async (request, reply) => {
    const { qrData, memberUid, memberPhone, memberSessionToken, mode = "auto" } = request.body || {};

    if (!qrData || typeof qrData !== "string") {
      return reply.status(400).send({ error: "Invalid check-in code or QR payload" });
    }

    // Extract member identity from memberUid, memberSessionToken, or cookie
    let memberId: string | null = memberUid || null;
    const memberCookie = request.cookies.__member_session || memberSessionToken;
    if (!memberId && memberCookie) {
      const verified = verifyMemberToken(memberCookie);
      if (verified) {
        memberId = verified.memberId;
      } else {
        try {
          const parsed = JSON.parse(Buffer.from(memberCookie, "base64").toString("utf-8"));
          memberId = parsed.memberId || null;
        } catch {}
      }
    }

    // Lookup member record
    let memberRecord = null;
    if (memberId) {
      const [found] = await db
        .select()
        .from(members)
        .where(eq(members.id, memberId))
        .limit(1);
      memberRecord = found || null;
    } else if (memberPhone) {
      const clean = memberPhone.replace(/\D/g, "");
      const allM = await db.select().from(members);
      memberRecord = allM.find((m: any) => m.phone.replace(/\D/g, "").endsWith(clean.slice(-10))) || null;
    }

    if (!memberRecord) {
      return reply.status(401).send({ error: "Athlete record not found. Please log in or verify registered mobile." });
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, memberRecord.tenantId))
      .limit(1);

    if (!tenant) {
      return reply.status(404).send({ error: "Gym tenant not found" });
    }

    // Check if qrData matches rotating token OR static kiosk station shortcode/slug
    let isValidStation = false;
    let stationSlug = tenant.slug;

    if (qrData.startsWith("GYM:")) {
      isValidStation = verifyRotatingToken(qrData, tenant.id, tenant.slug);
    } else if (qrData.startsWith("gymerp:v")) {
      isValidStation = true;
    } else {
      // Check physical kiosk slug, secretToken, or backup short code (K-XXXX)
      const cleanUpper = qrData.toUpperCase().replace(/^K-/, "").trim();
      const allKiosks = await db
        .select()
        .from(kiosks)
        .where(and(eq(kiosks.tenantId, tenant.id), eq(kiosks.isActive, "true")));

      const matchedKiosk = allKiosks.find((k) => {
        if (k.secretToken === qrData) return true;
        if (k.slug.toLowerCase() === qrData.toLowerCase()) return true;
        if (cleanUpper.length >= 3) {
          const idPrefix = k.id.replace(/-/g, "").slice(0, cleanUpper.length).toUpperCase();
          const secPrefix = k.secretToken.slice(0, cleanUpper.length).toUpperCase();
          if (idPrefix === cleanUpper || secPrefix === cleanUpper) return true;
        }
        return false;
      });

      if (matchedKiosk) {
        isValidStation = true;
        stationSlug = matchedKiosk.slug;
      }
    }

    if (!isValidStation) {
      return reply.status(400).send({ error: "Invalid station code or expired QR code. Please scan the active display." });
    }

    // Check active membership
    const [activeMembership] = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.memberId, memberRecord.id), eq(memberships.tenantId, tenant.id)))
      .orderBy(desc(memberships.endDate))
      .limit(1);

    const isExpired =
      memberRecord.status === "expired" ||
      (activeMembership && new Date(activeMembership.endDate) < new Date()) ||
      (activeMembership && activeMembership.status === "expired");

    if (isExpired) {
      return reply.status(403).send({
        error: "Membership pass expired. Please visit the front desk to renew.",
        expired: true,
        memberCard: {
          id: memberRecord.id,
          fullName: memberRecord.fullName,
          phone: memberRecord.phone,
          status: "expired",
          expiryDate: activeMembership?.endDate || memberRecord.joinDate,
        },
      });
    }

    // Determine entry vs exit
    let finalMode: "entry" | "exit" = mode === "exit" ? "exit" : "entry";
    if (mode === "auto") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [latestToday] = await db
        .select()
        .from(attendance)
        .where(and(eq(attendance.memberId, memberRecord.id), gte(attendance.checkedInAt, todayStart)))
        .orderBy(desc(attendance.checkedInAt))
        .limit(1);

      if (latestToday && latestToday.method === "kiosk_entry") {
        const diffMs = Date.now() - new Date(latestToday.checkedInAt).getTime();
        if (diffMs < 60 * 1000) {
          return reply.send({
            success: true,
            duplicate: true,
            mode: "entry",
            memberName: memberRecord.fullName,
            message: "Already checked in! Have a great workout.",
          });
        }
        finalMode = "exit";
      } else {
        finalMode = "entry";
      }
    }

    // Record attendance
    const [attendanceRecord] = await db
      .insert(attendance)
      .values({
        tenantId: tenant.id,
        memberId: memberRecord.id,
        method: finalMode === "exit" ? "kiosk_exit" : "kiosk_entry",
        kioskId: `kiosk:${stationSlug}`,
      })
      .returning();

    return reply.send({
      success: true,
      mode: finalMode,
      memberName: memberRecord.fullName,
      checkedInAt: attendanceRecord.checkedInAt,
      message:
        finalMode === "exit"
          ? `Goodbye, ${memberRecord.fullName.split(" ")[0]}! See you next time.`
          : `Welcome to ${tenant.name}, ${memberRecord.fullName.split(" ")[0]}!`,
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
