"use server";

import { withTenantDb } from "@/lib/db/tenant";
import { members, attendance, memberships, membershipPlans } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { getMemberSession } from "@/lib/auth/member-session";
import { generateGymRotatingQr, verifyGymRotatingQr, KioskMode } from "@/lib/attendance/qr";
import { eq, desc, and, gte, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getRotatingQrAction(mode: KioskMode = "entry") {
  const session = await getSession();
  if (!session || !session.tenantId) {
    throw new Error("Unauthorized: Active session required");
  }

  return await generateGymRotatingQr(session.tenantId, mode);
}

export async function recordAttendanceScanAction(
  memberId: string,
  qrToken: string,
  requestedMode?: KioskMode
) {
  const session = await getSession();
  if (!session || !session.tenantId) {
    return { success: false, message: "Authentication session required" };
  }

  // 1. Verify dynamic rotating QR token
  const verification = verifyGymRotatingQr(session.tenantId, qrToken);
  if (!verification.valid) {
    return {
      success: false,
      message: verification.reason || "Check-in QR code expired. Please scan the current code.",
    };
  }

  const effectiveMode = requestedMode || verification.mode || "entry";

  return await withTenantDb(session, async (tx) => {
    // 2. Single-Use Replay Protection: ensure nonce has not been consumed
    if (verification.nonce) {
      const [alreadyConsumed] = await tx
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.tenantId, session.tenantId!),
            eq(attendance.kioskId, `qr:${verification.nonce}`)
          )
        )
        .limit(1);

      if (alreadyConsumed) {
        return {
          success: false,
          duplicate: true,
          message: "This single-use QR code has already been scanned. Please scan the newly generated code.",
        };
      }
    }

    // 3. Lookup Member
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

    // 4. Anti-Passback Check for entry (prevent double-entry within 5 minutes)
    if (effectiveMode === "entry") {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentCheckIns = await tx
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.memberId, member.id),
            eq(attendance.method, "kiosk_entry"),
            gte(attendance.checkedInAt, fiveMinutesAgo)
          )
        )
        .limit(1);

      if (recentCheckIns.length > 0) {
        return {
          success: false,
          duplicate: true,
          memberName: member.fullName,
          message: "Already checked in (<5 min ago). Anti-passback gate lock active.",
        };
      }
    }

    // 5. Burn single-use nonce & record attendance entry
    const [newCheckIn] = await tx
      .insert(attendance)
      .values({
        tenantId: session.tenantId!,
        memberId: member.id,
        method: effectiveMode === "exit" ? "kiosk_exit" : "kiosk_entry",
        kioskId: verification.nonce ? `qr:${verification.nonce}` : `kiosk-${effectiveMode}`,
      })
      .returning();

    revalidatePath("/admin/attendance");
    revalidatePath("/admin");
    revalidatePath("/admin/kiosk");
    revalidatePath("/staff");
    revalidatePath("/staff/kiosk");

    return {
      success: true,
      memberName: member.fullName,
      mode: effectiveMode,
      checkedInAt: newCheckIn.checkedInAt,
      message:
        effectiveMode === "exit"
          ? "Check-Out Confirmed · Great workout!"
          : "Access Granted · Welcome!",
    };
  });
}

/**
 * Member-Initiated Smartphone Scan Action:
 * When an athlete scans the physical kiosk QR with their phone camera,
 * this action verifies their identity and burns the dynamic kiosk nonce.
 */
export async function memberSelfScanKioskAction(input: {
  qrToken: string;
  memberPhone?: string;
  overrideMode?: KioskMode;
}) {
  const session = await getSession();
  const memberSession = await getMemberSession();
  
  // Extract tenantId from token format (gymerp:v3:tenantId:...)
  let tokenTenantId: string | null = memberSession?.tenantId || session?.tenantId || null;
  let parsedToken = input.qrToken;

  if (parsedToken.includes("token=")) {
    try {
      const url = new URL(parsedToken);
      parsedToken = url.searchParams.get("token") || parsedToken;
    } catch {
      // not url
    }
  }

  if (parsedToken.startsWith("gymerp:v3:") || parsedToken.startsWith("gymerp:v2:")) {
    const parts = parsedToken.split(":");
    tokenTenantId = parts[2] || tokenTenantId;
  }

  if (!tokenTenantId) {
    return { success: false, message: "Invalid kiosk token or gym location unrecognized" };
  }

  // 1. Verify rotating QR token
  const verification = verifyGymRotatingQr(tokenTenantId, parsedToken);
  if (!verification.valid) {
    return {
      success: false,
      message: verification.reason || "Kiosk QR code expired. Please scan the fresh code on screen.",
    };
  }

  // Determine mode
  const effectiveMode = input.overrideMode || verification.mode || "entry";

  // Create virtual session context for tenant query
  const sessionCtx = {
    uid: memberSession?.memberId || session?.uid || "guest-scan",
    email: memberSession?.email || session?.email || "athlete@scanner.local",
    role: (memberSession ? "member" : session?.role || "member") as any,
    tenantId: tokenTenantId,
  };

  return await withTenantDb(sessionCtx, async (tx) => {
    // 2. Anti-Replay: Check if nonce already consumed
    if (verification.nonce) {
      const [alreadyConsumed] = await tx
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.tenantId, tokenTenantId!),
            eq(attendance.kioskId, `qr:${verification.nonce}`)
          )
        )
        .limit(1);

      if (alreadyConsumed) {
        return {
          success: false,
          duplicate: true,
          message: "This QR pass was already scanned. Look at the kiosk screen for the new code.",
        };
      }
    }

    // 3. Match athlete: by member session or by clean phone number
    let memberRecord = null;
    if (memberSession?.memberId) {
      const [foundById] = await tx
        .select()
        .from(members)
        .where(and(eq(members.id, memberSession.memberId), eq(members.tenantId, tokenTenantId!)))
        .limit(1);
      memberRecord = foundById || null;
    } else if (input.memberPhone && input.memberPhone.trim()) {
      const cleanPhone = input.memberPhone.replace(/\D/g, "");
      const allMembers = await tx
        .select()
        .from(members)
        .where(eq(members.tenantId, tokenTenantId!));

      memberRecord =
        allMembers.find((m: any) =>
          m.phone.replace(/\D/g, "").endsWith(cleanPhone.slice(-10))
        ) || null;
    }

    if (!memberRecord) {
      return {
        success: false,
        requirePhone: true,
        message: "Athlete record not found. Please verify your registered mobile number.",
      };
    }

    // Query active / latest membership for this athlete
    const [membershipRecord] = await tx
      .select()
      .from(memberships)
      .where(and(eq(memberships.memberId, memberRecord.id), eq(memberships.tenantId, tokenTenantId!)))
      .orderBy(desc(memberships.endDate))
      .limit(1);

    const isExpired =
      memberRecord.status === "expired" ||
      (membershipRecord && new Date(membershipRecord.endDate) < new Date()) ||
      (membershipRecord && membershipRecord.status === "expired");

    const memberCard = {
      id: memberRecord.id,
      fullName: memberRecord.fullName,
      phone: memberRecord.phone,
      joinDate: memberRecord.joinDate,
      expiryDate: membershipRecord?.endDate || memberRecord.joinDate,
      status: isExpired
        ? ("expired" as const)
        : memberRecord.status === "frozen"
        ? ("frozen" as const)
        : ("active" as const),
    };

    if (isExpired) {
      return {
        success: false,
        expired: true,
        memberCard,
        message: "Membership Expired. Please visit the front desk to renew your pass.",
      };
    }

    if (memberRecord.status !== "active") {
      return {
        success: false,
        memberCard,
        message: `Athlete account status is ${memberRecord.status.toUpperCase()}. Please check with front desk staff.`,
      };
    }

    // 4. If mode is "auto", detect if currently inside the gym
    let finalMode: "entry" | "exit" = effectiveMode === "exit" ? "exit" : "entry";
    if (effectiveMode === "auto") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [latestToday] = await tx
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.memberId, memberRecord.id),
            gte(attendance.checkedInAt, todayStart)
          )
        )
        .orderBy(desc(attendance.checkedInAt))
        .limit(1);

      if (latestToday && latestToday.method === "kiosk_entry") {
        finalMode = "exit";
      } else {
        finalMode = "entry";
      }
    }

    // 5. Anti-Passback Check
    if (finalMode === "entry") {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const [recentEntry] = await tx
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.memberId, memberRecord.id),
            eq(attendance.method, "kiosk_entry"),
            gte(attendance.checkedInAt, fiveMinutesAgo)
          )
        )
        .limit(1);

      if (recentEntry) {
        return {
          success: false,
          duplicate: true,
          memberName: memberRecord.fullName,
          memberCard,
          message: "You already checked in less than 5 minutes ago. Check-in is already confirmed.",
        };
      }
    }

    // 6. Burn single-use nonce & record attendance
    const [newLog] = await tx
      .insert(attendance)
      .values({
        tenantId: tokenTenantId!,
        memberId: memberRecord.id,
        method: finalMode === "exit" ? "kiosk_exit" : "kiosk_entry",
        kioskId: verification.nonce ? `qr:${verification.nonce}` : `kiosk-${finalMode}`,
      })
      .returning();

    revalidatePath("/admin/attendance");
    revalidatePath("/admin");
    revalidatePath("/admin/kiosk");
    revalidatePath("/staff");
    revalidatePath("/staff/kiosk");

    return {
      success: true,
      memberName: memberRecord.fullName,
      memberCard,
      mode: finalMode,
      checkedInAt: newLog.checkedInAt,
      message:
        finalMode === "exit"
          ? `Check-Out Confirmed · See you tomorrow, ${memberRecord.fullName.split(" ")[0]}!`
          : `Access Granted · Have a great session, ${memberRecord.fullName.split(" ")[0]}!`,
    };
  });
}

/**
 * Keypad / Phone Check-In Action:
 * When an athlete's phone battery is dead, they enter their phone number
 * or Gym Pass ID into the kiosk terminal.
 * Returns full gym membership info: ID, Name, Joining Date, Expiry Date.
 * If expired, flags in red and alerts them to talk to front desk.
 */
export async function kioskPassOrPhoneCheckInAction(input: {
  identifier: string;
  mode?: KioskMode;
  tenantId?: string;
}) {
  const rawId = input.identifier.trim();
  if (!rawId) {
    return { success: false, message: "Please enter your phone number or pass ID" };
  }

  const session = await getSession();
  const effectiveTenantId = session?.tenantId || input.tenantId;

  if (!effectiveTenantId) {
    return { success: false, message: "Gym facility context required" };
  }

  const cleanDigits = rawId.replace(/\D/g, "");

  const sessionCtx = {
    uid: session?.uid || "kiosk-terminal",
    email: session?.email || "kiosk@gymerp.local",
    role: (session?.role || "staff") as any,
    tenantId: effectiveTenantId,
  };

  return await withTenantDb(sessionCtx, async (tx) => {
    // 1. Find member by ID, phone, or QR token
    const allMembers = await tx
      .select()
      .from(members)
      .where(eq(members.tenantId, effectiveTenantId));

    const member = allMembers.find((m: any) => {
      if (m.id.toLowerCase() === rawId.toLowerCase()) return true;
      if (m.qrToken.toLowerCase() === rawId.toLowerCase()) return true;
      if (m.phone.replace(/\D/g, "") === cleanDigits) return true;
      if (cleanDigits.length >= 7 && m.phone.replace(/\D/g, "").endsWith(cleanDigits.slice(-10))) return true;
      return false;
    });

    if (!member) {
      return {
        success: false,
        message: "No athlete account found matching this phone number or pass ID.",
      };
    }

    // 2. Fetch active/latest membership to calculate expiry date
    const [membership] = await tx
      .select()
      .from(memberships)
      .where(and(eq(memberships.memberId, member.id), eq(memberships.tenantId, effectiveTenantId)))
      .orderBy(desc(memberships.endDate))
      .limit(1);

    const isExpired =
      member.status === "expired" ||
      (membership && new Date(membership.endDate) < new Date()) ||
      (membership && membership.status === "expired");

    const memberCard = {
      id: member.id,
      fullName: member.fullName,
      phone: member.phone,
      joinDate: member.joinDate,
      expiryDate: membership?.endDate || member.joinDate,
      status: isExpired
        ? ("expired" as const)
        : member.status === "frozen"
        ? ("frozen" as const)
        : ("active" as const),
    };

    if (isExpired) {
      return {
        success: false,
        expired: true,
        member: memberCard,
        message: "Membership Expired. Please visit the front desk to renew before entering.",
      };
    }

    if (member.status !== "active") {
      return {
        success: false,
        expired: false,
        member: memberCard,
        message: `Athlete account status is ${member.status.toUpperCase()}. Please see front-desk staff.`,
      };
    }

    // 3. Determine entry or exit
    let finalMode: "entry" | "exit" = input.mode === "exit" ? "exit" : "entry";
    if (input.mode === "auto") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [latestToday] = await tx
        .select()
        .from(attendance)
        .where(and(eq(attendance.memberId, member.id), gte(attendance.checkedInAt, todayStart)))
        .orderBy(desc(attendance.checkedInAt))
        .limit(1);

      if (latestToday && latestToday.method === "kiosk_entry") {
        finalMode = "exit";
      } else {
        finalMode = "entry";
      }
    }

    // 4. Record attendance
    const [newCheckIn] = await tx
      .insert(attendance)
      .values({
        tenantId: effectiveTenantId,
        memberId: member.id,
        method: finalMode === "exit" ? "kiosk_exit" : "kiosk_entry",
        kioskId: "kiosk-keypad",
      })
      .returning();

    revalidatePath("/admin/attendance");
    revalidatePath("/admin");
    revalidatePath("/admin/kiosk");
    revalidatePath("/staff");
    revalidatePath("/staff/kiosk");

    return {
      success: true,
      expired: false,
      member: memberCard,
      mode: finalMode,
      checkedInAt: newCheckIn.checkedInAt,
      message:
        finalMode === "exit"
          ? `Check-Out Confirmed · See you tomorrow, ${member.fullName.split(" ")[0]}!`
          : `Access Granted · Welcome, ${member.fullName.split(" ")[0]}!`,
    };
  });
}

export async function staffManualCheckInAction(
  memberId: string,
  mode: "entry" | "exit" = "entry"
) {
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

    // Query active / latest membership
    const [membership] = await tx
      .select()
      .from(memberships)
      .where(and(eq(memberships.memberId, member.id), eq(memberships.tenantId, session.tenantId!)))
      .orderBy(desc(memberships.endDate))
      .limit(1);

    const isExpired =
      member.status === "expired" ||
      (membership && new Date(membership.endDate) < new Date()) ||
      (membership && membership.status === "expired");

    if (isExpired) {
      return {
        success: false,
        expired: true,
        message: "Athlete membership is EXPIRED. Renewal required before admission.",
      };
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
        method: mode === "exit" ? "kiosk_exit" : "kiosk_entry",
        kioskId: "front-desk-manual",
      })
      .returning();

    revalidatePath("/admin/attendance");
    revalidatePath("/admin");
    revalidatePath("/staff");
    revalidatePath("/staff/kiosk");

    return {
      success: true,
      memberName: member.fullName,
      mode,
      checkedInAt: newCheckIn.checkedInAt,
      message: mode === "exit" ? "Manual Check-Out Recorded" : "Manual Check-In Confirmed",
    };
  });
}
