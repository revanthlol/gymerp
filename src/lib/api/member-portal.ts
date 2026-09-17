"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { members, memberships, membershipPlans, tenants, attendance, payments, gymClasses } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { signMemberToken, getMemberSession, MemberSession } from "@/lib/auth/member-session";
import { redirect } from "next/navigation";

export async function memberLoginAction(input: {
  email?: string;
  identifier?: string;
  tenantSlug?: string;
}) {
  const rawEmail = (input.email ?? input.identifier ?? "").trim();
  if (!rawEmail) {
    return { success: false, message: "Please enter your registered email address" };
  }

  try {
    // Search strictly by registered email
    const matchedMembers = await db
      .select({
        id: members.id,
        tenantId: members.tenantId,
        fullName: members.fullName,
        email: members.email,
        phone: members.phone,
        status: members.status,
        qrToken: members.qrToken,
      })
      .from(members)
      .where(eq(members.email, rawEmail.toLowerCase()))
      .limit(5);

    if (matchedMembers.length === 0) {
      return {
        success: false,
        message: "No gym account found matching that email address. Please check with front-desk staff.",
      };
    }

    const member = matchedMembers[0];

    const payload: MemberSession = {
      memberId: member.id,
      tenantId: member.tenantId,
      fullName: member.fullName,
      phone: member.phone,
      email: member.email,
      qrToken: member.qrToken,
    };

    const token = signMemberToken(payload);

    cookies().set("__member_session", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return {
      success: true,
      fullName: member.fullName,
      memberId: member.id,
    };
  } catch (err: any) {
    console.error("Member login error:", err);
    return { success: false, message: err?.message || "Failed to log in" };
  }
}

export async function memberLogoutAction() {
  cookies().set("__member_session", "", { path: "/", maxAge: 0 });
  redirect("/member/login");
}

export async function getMemberPortalDataAction() {
  const session = await getMemberSession();
  if (!session) {
    redirect("/member/login");
  }

  // Fetch Member, Tenant, Memberships, Attendance, Payments, and Classes
  const [memberRows, tenantRows, membershipRows, attendanceRows, paymentRows, classRows] =
    await Promise.all([
      db
        .select()
        .from(members)
        .where(eq(members.id, session.memberId))
        .limit(1),

      db
        .select({
          name: tenants.name,
          slug: tenants.slug,
          phone: tenants.phone,
          contactEmail: tenants.contactEmail,
        })
        .from(tenants)
        .where(eq(tenants.id, session.tenantId))
        .limit(1),

      db
        .select({
          id: memberships.id,
          startDate: memberships.startDate,
          endDate: memberships.endDate,
          status: memberships.status,
          planName: membershipPlans.name,
          planPrice: membershipPlans.price,
          durationDays: membershipPlans.durationDays,
        })
        .from(memberships)
        .innerJoin(membershipPlans, eq(memberships.planId, membershipPlans.id))
        .where(eq(memberships.memberId, session.memberId))
        .orderBy(desc(memberships.createdAt))
        .limit(5),

      db
        .select({
          id: attendance.id,
          checkedInAt: attendance.checkedInAt,
          method: attendance.method,
          kioskId: attendance.kioskId,
        })
        .from(attendance)
        .where(eq(attendance.memberId, session.memberId))
        .orderBy(desc(attendance.checkedInAt))
        .limit(50),

      db
        .select({
          id: payments.id,
          amount: payments.amount,
          method: payments.method,
          status: payments.status,
          paidAt: payments.paidAt,
          createdAt: payments.createdAt,
          notes: payments.notes,
        })
        .from(payments)
        .where(eq(payments.memberId, session.memberId))
        .orderBy(desc(payments.createdAt))
        .limit(10),

      db
        .select()
        .from(gymClasses)
        .where(and(eq(gymClasses.tenantId, session.tenantId), eq(gymClasses.isActive, "true")))
        .orderBy(desc(gymClasses.createdAt))
        .limit(6),
    ]);

  const member = memberRows[0];
  const tenant = tenantRows[0] || {
    name: "IronPulse Fitness",
    slug: "ironpulse",
    phone: "+1 (555) 019-2834",
    contactEmail: "admin@ironpulse.local",
  };

  if (!member) {
    redirect("/member/login");
  }

  // Calculate membership active status and days remaining
  const activeMembership = membershipRows.find((m) => m.status === "active") || membershipRows[0] || null;
  let daysRemaining = 0;
  if (activeMembership && activeMembership.endDate) {
    const end = new Date(activeMembership.endDate).getTime();
    const now = Date.now();
    daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }

  // Calculate workout streaks and counts
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const workoutsThisMonth = attendanceRows.filter((a) => {
    const d = new Date(a.checkedInAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // Calculate consecutive day streak
  let currentStreak = 0;
  if (attendanceRows.length > 0) {
    const dates = Array.from(
      new Set(
        attendanceRows.map((a) => {
          const d = new Date(a.checkedInAt);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        })
      )
    ).sort().reverse();

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    if (dates[0] === todayStr || dates[0] === yesterdayStr) {
      let checkDate = new Date(dates[0]);
      for (const dStr of dates) {
        const expected = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
        if (dStr === expected) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  return {
    member: {
      id: member.id,
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      status: member.status,
      joinDate: member.joinDate,
      qrToken: member.qrToken,
    },
    gym: tenant,
    activeMembership: activeMembership
      ? {
          ...activeMembership,
          daysRemaining,
        }
      : null,
    memberships: membershipRows,
    recentAttendance: attendanceRows,
    recentPayments: paymentRows,
    upcomingClasses: classRows,
    stats: {
      totalWorkouts: attendanceRows.length,
      workoutsThisMonth,
      currentStreak,
      daysRemaining,
    },
  };
}
