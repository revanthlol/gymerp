"use server";

import { withTenantDb } from "@/lib/db/tenant";
import { membershipPlans } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

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
