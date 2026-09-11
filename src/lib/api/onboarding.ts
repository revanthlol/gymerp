"use server";

import { withTenantDb } from "@/lib/db/tenant";
import { tenants, membershipPlans, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface OnboardingPlanInput {
  name: string;
  price: string;
  durationDays: number;
  description?: string;
}

export interface OnboardingDataInput {
  facilityName: string;
  phone: string;
  contactEmail: string;
  openingHours?: string;
  turnstileEntryLane?: string;
  turnstileExitLane?: string;
  plans: OnboardingPlanInput[];
  staffInvite?: {
    fullName: string;
    email: string;
  };
}

export async function getTenantOnboardingStatusAction() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    throw new Error("Authentication required");
  }

  return await withTenantDb(session, async (tx) => {
    const [tenant] = await tx
      .select()
      .from(tenants)
      .where(eq(tenants.id, session.tenantId!))
      .limit(1);

    const existingPlans = await tx
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.tenantId, session.tenantId!));

    return {
      tenant,
      plansCount: existingPlans.length,
      isCompleted: tenant?.status === "active" && existingPlans.length > 0,
    };
  });
}

export async function completeTenantOnboardingAction(input: OnboardingDataInput) {
  const session = await getSession();
  if (!session || !session.tenantId || session.role !== "admin") {
    throw new Error("Unauthorized: Only gym administrator can complete onboarding");
  }

  return await withTenantDb(session, async (tx) => {
    // 1. Update Tenant profile & status to active
    await tx
      .update(tenants)
      .set({
        name: input.facilityName.trim(),
        phone: input.phone.trim(),
        contactEmail: input.contactEmail.trim(),
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, session.tenantId!));

    // 2. Insert initial membership tiers if plans provided
    if (input.plans && input.plans.length > 0) {
      for (const p of input.plans) {
        if (!p.name.trim()) continue;
        await tx.insert(membershipPlans).values({
          tenantId: session.tenantId!,
          name: p.name.trim(),
          price: p.price.trim(),
          durationDays: p.durationDays || 30,
          description: p.description?.trim() || "Configured during facility onboarding",
          isActive: "true",
        });
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/plans");
    revalidatePath("/admin/onboarding");
    revalidatePath("/platform");

    return {
      success: true,
      message: "Facility setup successfully verified and activated!",
    };
  });
}
