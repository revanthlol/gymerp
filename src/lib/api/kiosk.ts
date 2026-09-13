"use server";

import { db } from "@/lib/db";
import { tenants, kiosks } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { generateGymRotatingQr, KioskMode, UniqueQrData } from "@/lib/attendance/qr";
import { eq, and, asc, desc } from "drizzle-orm";
import { cookies } from "next/headers";
import crypto from "crypto";

const KIOSK_COOKIE_SALT = process.env.KIOSK_COOKIE_SECRET || "gymerp-kiosk-secret-salt-2026";

function hashKioskToken(slug: string, passphrase: string): string {
  return crypto
    .createHmac("sha256", KIOSK_COOKIE_SALT)
    .update(`${slug}:${passphrase}`)
    .digest("hex");
}

/**
 * 1. Admin: Fetch current gym's kiosk settings (passphrase, public slug, and link)
 */
export async function getKioskSettingsAction() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    throw new Error("Unauthorized");
  }

  const [tenant] = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      kioskPassphrase: tenants.kioskPassphrase,
      logoUrl: tenants.logoUrl,
    })
    .from(tenants)
    .where(eq(tenants.id, session.tenantId))
    .limit(1);

  if (!tenant) {
    throw new Error("Gym tenant not found");
  }

  return {
    slug: tenant.slug,
    name: tenant.name,
    kioskPassphrase: tenant.kioskPassphrase || "123456",
    kioskUrl: `/kiosk/${tenant.slug}`,
    logoUrl: tenant.logoUrl,
  };
}

/**
 * 2. Admin: Update gym's kiosk passphrase
 */
export async function updateKioskPassphraseAction(newPassphrase: string) {
  const session = await getSession();
  if (!session || !session.tenantId || (session.role !== "admin" && session.role !== "platform")) {
    throw new Error("Unauthorized: Only gym admin can change kiosk passphrase");
  }

  const clean = newPassphrase.trim();
  if (clean.length < 4) {
    throw new Error("Passphrase must be at least 4 characters");
  }

  await db
    .update(tenants)
    .set({
      kioskPassphrase: clean,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, session.tenantId));

  return { success: true, passphrase: clean };
}

/**
 * 3. Public: Verify kiosk passphrase and issue secure cookie
 */
export async function verifyKioskPassphraseAction(slug: string, passphrase: string) {
  const [tenant] = await db
    .select({
      id: tenants.id,
      slug: tenants.slug,
      kioskPassphrase: tenants.kioskPassphrase,
    })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!tenant) {
    return { success: false, message: "Gym station not found" };
  }

  const expectedPassphrase = tenant.kioskPassphrase || "123456";
  if (passphrase.trim() !== expectedPassphrase.trim()) {
    return { success: false, message: "Incorrect passphrase" };
  }

  // Set secure HTTP-only cookie valid for 30 days
  const token = hashKioskToken(slug, expectedPassphrase);
  cookies().set(`kiosk_session_${slug}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/`,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return { success: true };
}

/**
 * 4. Public: Check if current browser session has unlocked the kiosk
 */
export async function isKioskUnlocked(slug: string): Promise<boolean> {
  // If an active admin session for this tenant exists, allow immediate access
  const session = await getSession();
  if (session && session.tenantId) {
    const [t] = await db
      .select({ slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.id, session.tenantId))
      .limit(1);
    if (t?.slug === slug) return true;
  }

  const cookieVal = cookies().get(`kiosk_session_${slug}`)?.value;
  if (!cookieVal) return false;

  const [tenant] = await db
    .select({
      slug: tenants.slug,
      kioskPassphrase: tenants.kioskPassphrase,
    })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!tenant) return false;

  const expected = hashKioskToken(slug, tenant.kioskPassphrase || "123456");
  return cookieVal === expected;
}

/**
 * 5. Public: Fetch public kiosk terminal data
 */
export async function getPublicKioskDataAction(slug: string, mode: KioskMode = "auto") {
  const [tenant] = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      logoUrl: tenants.logoUrl,
    })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!tenant) {
    return { error: "Gym station not found" };
  }

  const unlocked = await isKioskUnlocked(slug);
  if (!unlocked) {
    return {
      unlocked: false,
      gym: {
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl,
      },
    };
  }

  // Generate initial live rotating QR code
  const initialQr = await generateGymRotatingQr(tenant.id, mode);

  return {
    unlocked: true,
    gym: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: tenant.logoUrl,
    },
    initialQr,
  };
}

/**
 * 6. Public: Fetch next rotating QR token for unlocked kiosk
 */
export async function getPublicKioskRotatingQrAction(
  slug: string,
  mode: KioskMode = "auto"
): Promise<{ success: boolean; qr?: UniqueQrData; error?: string }> {
  const unlocked = await isKioskUnlocked(slug);
  if (!unlocked) {
    return { success: false, error: "Kiosk station is locked" };
  }

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!tenant) {
    return { success: false, error: "Gym not found" };
  }

  const qr = await generateGymRotatingQr(tenant.id, mode);
  return { success: true, qr };
}

/**
 * 7. Public: Lock the kiosk and clear session cookie
 */
export async function lockKioskAction(slug: string) {
  cookies().delete(`kiosk_session_${slug}`);
  return { success: true };
}

/**
 * Helper to generate a clean URL slug with collision prevention
 */
function createKioskSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base || "station"}-${suffix}`;
}

/**
 * 8. Admin: List all kiosks for the current gym tenant
 * Auto-initializes a default "Main Entrance" kiosk if none exist yet.
 */
export async function getTenantKiosksAction() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    throw new Error("Unauthorized");
  }

  let list = await db
    .select()
    .from(kiosks)
    .where(eq(kiosks.tenantId, session.tenantId))
    .orderBy(asc(kiosks.createdAt));

  // If no kiosks configured yet, create default "Main Entrance" station
  if (list.length === 0) {
    const defaultToken = crypto.randomBytes(20).toString("hex");
    const [created] = await db
      .insert(kiosks)
      .values({
        tenantId: session.tenantId,
        name: "Main Entrance",
        slug: "main-entrance",
        secretToken: defaultToken,
        mode: "auto",
        isActive: "true",
      })
      .returning();

    if (created) {
      list = [created];
    }
  }

  return list;
}

/**
 * 9. Admin: Register a new physical kiosk station
 */
export async function createKioskAction(input: {
  name: string;
  mode?: "auto" | "entry" | "exit";
}) {
  const session = await getSession();
  if (!session || !session.tenantId || (session.role !== "admin" && session.role !== "platform")) {
    throw new Error("Unauthorized: Only gym administrators can create kiosks");
  }

  const cleanName = input.name.trim();
  if (!cleanName || cleanName.length < 2) {
    throw new Error("Kiosk name must be at least 2 characters long");
  }

  const slug = createKioskSlug(cleanName);
  const secretToken = crypto.randomBytes(20).toString("hex");
  const mode = input.mode || "auto";

  const [created] = await db
    .insert(kiosks)
    .values({
      tenantId: session.tenantId,
      name: cleanName,
      slug,
      secretToken,
      mode,
      isActive: "true",
    })
    .returning();

  return { success: true, kiosk: created };
}

/**
 * 10. Admin: Update kiosk properties (name, mode, active state)
 */
export async function updateKioskAction(input: {
  id: string;
  name?: string;
  mode?: "auto" | "entry" | "exit";
  isActive?: "true" | "false";
}) {
  const session = await getSession();
  if (!session || !session.tenantId || (session.role !== "admin" && session.role !== "platform")) {
    throw new Error("Unauthorized: Only gym administrators can modify kiosks");
  }

  const updateData: Partial<typeof kiosks.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.name && input.name.trim().length >= 2) {
    updateData.name = input.name.trim();
  }
  if (input.mode) {
    updateData.mode = input.mode;
  }
  if (input.isActive) {
    updateData.isActive = input.isActive;
  }

  const [updated] = await db
    .update(kiosks)
    .set(updateData)
    .where(and(eq(kiosks.id, input.id), eq(kiosks.tenantId, session.tenantId)))
    .returning();

  if (!updated) {
    throw new Error("Kiosk station not found or permission denied");
  }

  return { success: true, kiosk: updated };
}

/**
 * 11. Admin: Regenerate secret access token for a kiosk station
 */
export async function regenerateKioskTokenAction(kioskId: string) {
  const session = await getSession();
  if (!session || !session.tenantId || (session.role !== "admin" && session.role !== "platform")) {
    throw new Error("Unauthorized: Only gym administrators can regenerate kiosk tokens");
  }

  const newToken = crypto.randomBytes(20).toString("hex");

  const [updated] = await db
    .update(kiosks)
    .set({
      secretToken: newToken,
      updatedAt: new Date(),
    })
    .where(and(eq(kiosks.id, kioskId), eq(kiosks.tenantId, session.tenantId)))
    .returning();

  if (!updated) {
    throw new Error("Kiosk not found");
  }

  return { success: true, secretToken: newToken, kiosk: updated };
}

/**
 * 12. Admin: Delete a kiosk station
 */
export async function deleteKioskAction(kioskId: string) {
  const session = await getSession();
  if (!session || !session.tenantId || (session.role !== "admin" && session.role !== "platform")) {
    throw new Error("Unauthorized: Only gym administrators can remove kiosks");
  }

  await db
    .delete(kiosks)
    .where(and(eq(kiosks.id, kioskId), eq(kiosks.tenantId, session.tenantId)));

  return { success: true };
}

/**
 * 13. Public / Station: Load dedicated zero-touch station display data by secret token
 */
export async function getKioskStationDataAction(token: string) {
  if (!token || token.trim().length === 0) {
    return { error: "Missing kiosk station token" };
  }

  const [kiosk] = await db
    .select()
    .from(kiosks)
    .where(eq(kiosks.secretToken, token.trim()))
    .limit(1);

  if (!kiosk || kiosk.isActive !== "true") {
    return { error: "Kiosk station not found or deactivated by administrator" };
  }

  const [tenant] = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      logoUrl: tenants.logoUrl,
    })
    .from(tenants)
    .where(eq(tenants.id, kiosk.tenantId))
    .limit(1);

  if (!tenant) {
    return { error: "Associated gym tenant not found" };
  }

  // Update heartbeat
  await db
    .update(kiosks)
    .set({ lastHeartbeatAt: new Date() })
    .where(eq(kiosks.id, kiosk.id));

  return {
    success: true,
    kiosk: {
      id: kiosk.id,
      name: kiosk.name,
      slug: kiosk.slug,
      secretToken: kiosk.secretToken,
      mode: kiosk.mode,
      lastHeartbeatAt: kiosk.lastHeartbeatAt,
    },
    gym: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: tenant.logoUrl,
    },
  };
}

/**
 * 14. Station: Heartbeat ping from kiosk display
 */
export async function recordKioskHeartbeatAction(token: string) {
  if (!token) return { success: false };

  const [updated] = await db
    .update(kiosks)
    .set({ lastHeartbeatAt: new Date() })
    .where(eq(kiosks.secretToken, token.trim()))
    .returning({ id: kiosks.id });

  return { success: !!updated };
}

