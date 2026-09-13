"use server";

import { withTenantDb } from "@/lib/db/tenant";
import { membershipPlans } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

export interface CreatePlanInput {
  name: string;
  description?: string;
  price: string;
  durationDays: number;
}

export async function createPlanAction(input: CreatePlanInput) {
  const session = await getSession();
  if (!session || !session.tenantId || session.role !== "admin") {
    throw new Error("Unauthorized: Only gym admin can create membership plans");
  }

  return await withTenantDb(session, async (tx) => {
    const [newPlan] = await tx
      .insert(membershipPlans)
      .values({
        tenantId: session.tenantId!,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        price: input.price.trim(),
        durationDays: input.durationDays,
        isActive: "true",
      })
      .returning();

    revalidatePath("/admin/plans");
    revalidatePath("/admin");

    return { success: true, plan: newPlan };
  });
}

export async function deletePlanAction(planId: string) {
  const session = await getSession();
  if (!session || !session.tenantId || session.role !== "admin") {
    throw new Error("Unauthorized: Only gym admin can delete membership plans");
  }

  return await withTenantDb(session, async (tx) => {
    await tx
      .delete(membershipPlans)
      .where(and(eq(membershipPlans.id, planId), eq(membershipPlans.tenantId, session.tenantId!)));

    revalidatePath("/admin/plans");
    return { success: true };
  });
}

export interface UpdatePlanInput {
  name: string;
  description?: string;
  price: string;
  durationDays: number;
  isActive?: "true" | "false";
}

export async function updatePlanAction(planId: string, input: UpdatePlanInput) {
  const session = await getSession();
  if (!session || !session.tenantId || session.role !== "admin") {
    throw new Error("Unauthorized: Only gym admin can update membership plans");
  }

  return await withTenantDb(session, async (tx) => {
    const [updatedPlan] = await tx
      .update(membershipPlans)
      .set({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        price: input.price.trim(),
        durationDays: input.durationDays,
        ...(input.isActive ? { isActive: input.isActive } : {}),
      })
      .where(and(eq(membershipPlans.id, planId), eq(membershipPlans.tenantId, session.tenantId!)))
      .returning();

    revalidatePath("/admin/plans");
    revalidatePath("/admin");

    return { success: true, plan: updatedPlan };
  });
}

export async function togglePlanStatusAction(planId: string, isActive: "true" | "false") {
  const session = await getSession();
  if (!session || !session.tenantId || session.role !== "admin") {
    throw new Error("Unauthorized: Only gym admin can update membership plans");
  }

  return await withTenantDb(session, async (tx) => {
    const [updatedPlan] = await tx
      .update(membershipPlans)
      .set({ isActive })
      .where(and(eq(membershipPlans.id, planId), eq(membershipPlans.tenantId, session.tenantId!)))
      .returning();

    revalidatePath("/admin/plans");
    revalidatePath("/admin");

    return { success: true, plan: updatedPlan };
  });
}

