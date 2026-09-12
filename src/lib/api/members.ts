"use server";

import { withTenantDb } from "@/lib/db/tenant";
import { members, memberships, membershipPlans, attendance } from "@/lib/db/schema";
import { createMemberSchema, CreateMemberInput } from "@/lib/validations/member";
import { getSession } from "@/lib/auth/session";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createMemberAction(rawInput: CreateMemberInput) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "staff")) {
    throw new Error("Unauthorized: Only gym admin or staff can add members");
  }

  if (!session.tenantId) {
    throw new Error("Invalid session: Missing tenant ID");
  }

  const input = createMemberSchema.parse(rawInput);

  return await withTenantDb(session, async (tx) => {
    // 1. Insert Member
    const [newMember] = await tx
      .insert(members)
      .values({
        tenantId: session.tenantId!,
        fullName: input.fullName,
        email: input.email || null,
        phone: input.phone,
        gender: input.gender,
        dateOfBirth: input.dateOfBirth || null,
        emergencyContact: input.emergencyContact || null,
        status: "active",
      })
      .returning();

    // 2. If plan is selected, create membership
    if (input.planId) {
      const [plan] = await tx
        .select()
        .from(membershipPlans)
        .where(eq(membershipPlans.id, input.planId))
        .limit(1);

      if (plan) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.durationDays);

        await tx.insert(memberships).values({
          tenantId: session.tenantId!,
          memberId: newMember.id,
          planId: plan.id,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          status: "active",
        });
      }
    }

    revalidatePath("/admin/members");
    revalidatePath("/admin");
    revalidatePath("/staff/members");
    revalidatePath("/staff");

    return {
      success: true,
      member: newMember,
    };
  });
}

export async function getMemberActivitiesAction(memberId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  return await withTenantDb(session, async (tx) => {
    const activities = await tx
      .select()
      .from(attendance)
      .where(eq(attendance.memberId, memberId))
      .orderBy(desc(attendance.checkedInAt))
      .limit(20);

    return activities;
  });
}

export async function updateMemberNotesAction(memberId: string, notes: string) {
  const session = await getSession();
  if (!session || !session.tenantId || (session.role !== "admin" && session.role !== "staff")) {
    throw new Error("Unauthorized");
  }

  return await withTenantDb(session, async (tx) => {
    const [updated] = await tx
      .update(members)
      .set({ notes: notes.trim(), updatedAt: new Date() })
      .where(and(eq(members.id, memberId), eq(members.tenantId, session.tenantId!)))
      .returning();

    revalidatePath("/admin/members");
    return { success: true, member: updated };
  });
}

export async function updateMemberStatusAction(
  memberId: string,
  status: "active" | "expired" | "frozen"
) {
  const session = await getSession();
  if (!session || !session.tenantId || (session.role !== "admin" && session.role !== "staff")) {
    throw new Error("Unauthorized");
  }

  return await withTenantDb(session, async (tx) => {
    const [updated] = await tx
      .update(members)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(members.id, memberId), eq(members.tenantId, session.tenantId!)))
      .returning();

    revalidatePath("/admin/members");
    revalidatePath("/admin");
    return { success: true, member: updated };
  });
}

export async function deleteMemberAction(memberId: string): Promise<
  | { success: true }
  | { success: false; error: string }
> {
  try {
    const session = await getSession();
    if (!session || !session.tenantId || (session.role !== "admin" && session.role !== "staff")) {
      return { success: false, error: "Unauthorized: Only gym admin or staff can remove athlete accounts" };
    }

    return await withTenantDb(session, async (tx) => {
      // Cleanly delete child records in case cascade isn't configured in PostgreSQL
      await tx.delete(attendance).where(eq(attendance.memberId, memberId));
      await tx.delete(memberships).where(eq(memberships.memberId, memberId));

      await tx
        .delete(members)
        .where(and(eq(members.id, memberId), eq(members.tenantId, session.tenantId!)));

      revalidatePath("/admin/members");
      revalidatePath("/admin");
      revalidatePath("/staff/members");
      revalidatePath("/staff");
      return { success: true };
    });
  } catch (err: any) {
    console.error("Error deleting member:", err);
    return { success: false, error: err?.message || "Failed to remove member account" };
  }
}

