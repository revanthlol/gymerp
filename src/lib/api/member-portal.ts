"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { members, memberships, membershipPlans, tenants, attendance, payments } from "@/lib/db/schema";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { signMemberToken, getMemberSession, MemberSession } from "@/lib/auth/member-session";
import { redirect } from "next/navigation";
import QRCode from "qrcode";

export async function memberLoginAction(input: {
  identifier: string; // phone number or email
  tenantSlug?: string;
}) {
  const rawId = input.identifier.trim();
  if (!rawId) {
    return { success: false, message: "Please enter your registered phone number or email" };
  }

  // Normalize phone number: remove non-digits if mostly digits
  const cleanPhone = rawId.replace(/[\s\(\)\-\.]/g, "");

  try {
    // Search by phone or email
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
      .where(
        or(
          eq(members.phone, rawId),
          eq(members.phone, cleanPhone),
          eq(members.email, rawId.toLowerCase())
        )
      )
      .limit(5);

    if (matchedMembers.length === 0) {
      return {
        success: false,
        message: "No gym account found matching that phone number or email. Please check with front-desk staff.",
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
  redirect("/portal/login");
}

export async function getMemberPortalDataAction() {
  const session = await getMemberSession();
  if (!session) {
    redirect("/portal/login");
  }

  // Fetch Member, Tenant, Memberships, Attendance, and Payments
  const [memberRows, tenantRows, membershipRows, attendanceRows, paymentRows] =
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
        .limit(30),

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
    ]);

  const member = memberRows[0];
  const tenant = tenantRows[0] || {
    name: "IronPulse Fitness",
    slug: "ironpulse",
    phone: "+1 (555) 019-2834",
    contactEmail: "admin@ironpulse.local",
  };

  if (!member) {
    redirect("/portal/login");
  }

  // Generate crisp QR Data URL for member's pass
  const passQrUrl = await QRCode.toDataURL(member.qrToken, {
    margin: 2,
    width: 320,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

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

  return {
    member: {
      id: member.id,
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      status: member.status,
      joinDate: member.joinDate,
      qrToken: member.qrToken,
      passQrUrl,
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
    stats: {
      totalWorkouts: attendanceRows.length,
      workoutsThisMonth,
      daysRemaining,
    },
  };
}
