"use server";

import { adminAuth } from "@/lib/firebase/admin";
import { db } from "@/lib/db";
import { tenants, users } from "@/lib/db/schema";
import { createTenantSchema, CreateTenantInput } from "@/lib/validations/tenant";
import { withTenantDb } from "@/lib/db/tenant";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";

export type ProvisionTenantResult =
  | { success: true; tenant: any; inviteLink: string; tempPassword?: string }
  | { success: false; error: string };

export async function provisionTenantAction(rawInput: CreateTenantInput): Promise<ProvisionTenantResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "platform") {
      return { success: false, error: "Unauthorized: Only platform superadmin can provision gyms" };
    }

    const parseResult = createTenantSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const msg = parseResult.error.issues.map((i) => i.message).join(", ");
      return { success: false, error: msg || "Invalid gym provisioning input" };
    }

    const input = parseResult.data;

    // Calculate License Expiration
    const licenseExpiresAt = new Date();
    licenseExpiresAt.setDate(licenseExpiresAt.getDate() + input.licenseDurationDays);

    return await withTenantDb(
      { userId: session.uid, role: "platform", tenantId: null },
      async (tx) => {
        // 1. Check if slug already exists
        const existingSlug = await tx
          .select()
          .from(tenants)
          .where(eq(tenants.slug, input.slug))
          .limit(1);

        if (existingSlug.length > 0) {
          return {
            success: false,
            error: `A gym with the slug "${input.slug}" already exists. Please choose a different slug.`,
          };
        }

        // 2. Insert Tenant Record
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

        // 3. Create or Sync Firebase User with initial or custom password
        const tempPassword =
          input.adminPassword && input.adminPassword.trim().length >= 6
            ? input.adminPassword.trim()
            : `GymPass_${Math.random().toString(36).slice(-6)}!A1`;
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
            // Update password so the admin can log in with tempPassword if needed
            await adminAuth.updateUser(fbUid, {
              displayName: input.adminFullName,
              password: tempPassword,
            }).catch(() => null);
          } else {
            return {
              success: false,
              error: "Firebase Auth error: " + (err.message || "Failed to create user"),
            };
          }
        }

        // 4. Set Custom User Claims for Tenant Admin
        try {
          await adminAuth.setCustomUserClaims(fbUid, {
            role: "admin",
            tenant_id: newTenant.id,
          });
        } catch (claimsErr: any) {
          console.warn("Could not set custom claims:", claimsErr.message);
        }

        // 5. Insert or Update User Record in PostgreSQL
        const existingUserRecord = await tx
          .select()
          .from(users)
          .where(eq(users.firebaseUid, fbUid))
          .limit(1);

        if (existingUserRecord.length > 0) {
          await tx
            .update(users)
            .set({
              tenantId: newTenant.id,
              role: "admin",
              email: input.contactEmail,
              fullName: input.adminFullName,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUserRecord[0].id));
        } else {
          await tx.insert(users).values({
            firebaseUid: fbUid,
            tenantId: newTenant.id,
            role: "admin",
            email: input.contactEmail,
            fullName: input.adminFullName,
          });
        }

        // 6. Generate Password Reset / Invitation Link
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

        revalidatePath("/platform");

        return {
          success: true,
          tenant: newTenant,
          inviteLink,
          tempPassword,
        };
      }
    );
  } catch (err: any) {
    console.error("Failed to provision tenant:", err);
    return {
      success: false,
      error: err?.message || "Internal server error during gym provisioning",
    };
  }
}

export async function toggleTenantStatusAction(
  tenantId: string,
  newStatus: "active" | "suspended" | "trial"
) {
  const session = await getSession();
  if (!session || session.role !== "platform") {
    throw new Error("Unauthorized: Only platform superadmin can change gym status");
  }

  await withTenantDb(
    { userId: session.uid, role: "platform", tenantId: null },
    async (tx) => {
      // 1. Update status in PostgreSQL
      await tx
        .update(tenants)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(tenants.id, tenantId));

      // 2. If suspending, revoke all active sessions for users in this tenant
      if (newStatus === "suspended") {
        const tenantUsers = await tx
          .select({ firebaseUid: users.firebaseUid })
          .from(users)
          .where(eq(users.tenantId, tenantId));

        await Promise.all(
          tenantUsers.map((u: any) =>
            adminAuth.revokeRefreshTokens(u.firebaseUid).catch(() => null)
          )
        );
      }
    }
  );

  revalidatePath("/platform");
  return { success: true };
}
