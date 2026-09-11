"use server";

import { withTenantDb } from "@/lib/db/tenant";
import { gymClasses } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreateClassInput {
  name: string;
  trainer: string;
  time: string;
  durationMinutes?: number;
  dayOfWeek?: string;
  location?: string;
  capacity?: number;
  category?: "Strength" | "Cardio" | "Combat" | "Mind & Body";
}

export async function getClassesAction() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    throw new Error("Unauthorized: Gym admin or staff session required");
  }

  return await withTenantDb(session, async (tx) => {
    const list = await tx
      .select()
      .from(gymClasses)
      .where(and(eq(gymClasses.tenantId, session.tenantId!), eq(gymClasses.isActive, "true")))
      .orderBy(desc(gymClasses.createdAt));

    return list;
  });
}

export async function createClassAction(input: CreateClassInput) {
  const session = await getSession();
  if (!session || !session.tenantId || (session.role !== "admin" && session.role !== "staff")) {
    throw new Error("Unauthorized: Only gym admin or staff can schedule classes");
  }

  return await withTenantDb(session, async (tx) => {
    const [newClass] = await tx
      .insert(gymClasses)
      .values({
        tenantId: session.tenantId!,
        name: input.name.trim(),
        trainer: input.trainer.trim(),
        time: input.time.trim(),
        durationMinutes: input.durationMinutes || 60,
        dayOfWeek: input.dayOfWeek || "Daily",
        location: input.location?.trim() || "Main Studio",
        capacity: input.capacity || 20,
        bookedCount: 0,
        category: input.category || "Strength",
        isActive: "true",
      })
      .returning();

    revalidatePath("/admin/classes");
    revalidatePath("/admin");

    return {
      success: true,
      gymClass: newClass,
    };
  });
}

export async function deleteClassAction(classId: string) {
  const session = await getSession();
  if (!session || !session.tenantId || session.role !== "admin") {
    throw new Error("Unauthorized: Only gym admin can delete classes");
  }

  return await withTenantDb(session, async (tx) => {
    await tx
      .delete(gymClasses)
      .where(and(eq(gymClasses.id, classId), eq(gymClasses.tenantId, session.tenantId!)));

    revalidatePath("/admin/classes");
    revalidatePath("/admin");

    return { success: true };
  });
}

export async function adjustClassBookingAction(classId: string, delta: number) {
  const session = await getSession();
  if (!session || !session.tenantId) {
    throw new Error("Unauthorized");
  }

  return await withTenantDb(session, async (tx) => {
    const [existing] = await tx
      .select()
      .from(gymClasses)
      .where(and(eq(gymClasses.id, classId), eq(gymClasses.tenantId, session.tenantId!)))
      .limit(1);

    if (!existing) {
      throw new Error("Class session not found");
    }

    const newCount = Math.max(0, Math.min(existing.capacity, existing.bookedCount + delta));

    const [updated] = await tx
      .update(gymClasses)
      .set({
        bookedCount: newCount,
        updatedAt: new Date(),
      })
      .where(eq(gymClasses.id, classId))
      .returning();

    revalidatePath("/admin/classes");

    return { success: true, gymClass: updated };
  });
}
