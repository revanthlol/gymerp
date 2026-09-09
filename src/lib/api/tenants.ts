"use server";

import { adminAuth } from "@/lib/firebase/admin";
import { db } from "@/lib/db";
import { tenants, users } from "@/lib/db/schema";
import { createTenantSchema, CreateTenantInput } from "@/lib/validations/tenant";
import { withTenantDb } from "@/lib/db/tenant";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";

export async function provisionTenantAction(rawInput: CreateTenantInput) {
  const session = await getSession();
  if (!session || session.role !== "platform") {
    throw new Error("Unauthorized: Only platform superadmin can provision gyms");
  }

  const input = createTenantSchema.parse(rawInput);

  // Calculate License Expiration
  const licenseExpiresAt = new Date();
  licenseExpiresAt.setDate(licenseExpiresAt.getDate() + input.licenseDurationDays);

  return await withTenantDb(
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

      // 2. Create Firebase User with initial password
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
        inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`;
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
