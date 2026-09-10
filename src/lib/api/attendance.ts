"use server";

import { withTenantDb } from "@/lib/db/tenant";
import { members, attendance } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { generateGymRotatingQr, verifyGymRotatingQr } from "@/lib/attendance/qr";
import { eq, desc, and, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getRotatingQrAction() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    throw new Error("Unauthorized: Active session required");
  }

  return await generateGymRotatingQr(session.tenantId);
}

export async function recordAttendanceScanAction(memberId: string, qrToken: string) {
  const session = await getSession();
  if (!session || !session.tenantId) {
    return { success: false, message: "Authentication session required" };
  }

  // 1. Verify dynamic 2-hour rotating QR token
  const verification = verifyGymRotatingQr(session.tenantId, qrToken);
  if (!verification.valid) {
    return {
      success: false,
      message: verification.reason || "Turnstile QR code expired. Please scan the current code.",
    };
  }

  return await withTenantDb(session, async (tx) => {
    // 2. Lookup Member
    const [member] = await tx
      .select()
      .from(members)
      .where(and(eq(members.id, memberId), eq(members.tenantId, session.tenantId!)))
      .limit(1);

    if (!member) {
      return { success: false, message: "Member record not found" };
    }

    if (member.status !== "active") {
      return {
        success: false,
        message: `Membership status is ${member.status.toUpperCase()}. Please renew membership.`,
      };
    }

    // 3. Anti-Passback Check: Prevent double-tapping within 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCheckIns = await tx
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.memberId, member.id),
          gte(attendance.checkedInAt, tenMinutesAgo)
        )
      )
      .limit(1);

    if (recentCheckIns.length > 0) {
      return {
        success: false,
        duplicate: true,
        memberName: member.fullName,
        message: "Already checked in (<10 min ago). Anti-passback gate lock active.",
      };
    }

    // 4. Record real attendance entry
    const [newCheckIn] = await tx
      .insert(attendance)
      .values({
        tenantId: session.tenantId!,
        memberId: member.id,
        method: "qr_scan",
        verifiedBy: session.email || "Turnstile Kiosk",
      })
      .returning();

    revalidatePath("/admin/attendance");
    revalidatePath("/admin");
    revalidatePath("/staff");
    revalidatePath("/staff/kiosk");

    return {
      success: true,
      memberName: member.fullName,
      checkedInAt: newCheckIn.checkedInAt,
      message: "Access Granted · Turnstile Unlocked",
    };
  });
}

export async function staffManualCheckInAction(memberId: string) {
  const session = await getSession();
  if (!session || !session.tenantId || (session.role !== "admin" && session.role !== "staff")) {
    return { success: false, message: "Unauthorized staff action" };
  }

  return await withTenantDb(session, async (tx) => {
    const [member] = await tx
      .select()
      .from(members)
      .where(and(eq(members.id, memberId), eq(members.tenantId, session.tenantId!)))
      .limit(1);

    if (!member) {
      return { success: false, message: "Member record not found" };
    }

    if (member.status !== "active") {
      return {
        success: false,
        message: `Member status is ${member.status.toUpperCase()}`,
      };
    }

    const [newCheckIn] = await tx
      .insert(attendance)
      .values({
        tenantId: session.tenantId!,
        memberId: member.id,
        method: "manual",
        verifiedBy: session.email || "Front-Desk Staff",
      })
      .returning();

    revalidatePath("/admin/attendance");
    revalidatePath("/admin");
    revalidatePath("/staff");
    revalidatePath("/staff/kiosk");

    return {
      success: true,
      memberName: member.fullName,
      checkedInAt: newCheckIn.checkedInAt,
      message: "Manual Check-In Confirmed",
    };
  });
}
