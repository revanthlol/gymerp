"use server";

import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { generateGymRotatingQr, KioskMode, UniqueQrData } from "@/lib/attendance/qr";
import { eq } from "drizzle-orm";
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
export async function getPublicKioskDataAction(slug: string, mode: KioskMode = "entry") {
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
  mode: KioskMode = "entry"
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
