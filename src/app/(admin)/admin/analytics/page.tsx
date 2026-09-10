import React from "react";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { attendance, members, payments } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AnalyticsView } from "@/components/admin/analytics-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics & Performance Reports | GymERP",
  description: "Facility check-in heatmaps, membership retention health, and revenue analytics",
};

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  if (!session || !session.tenantId || session.role !== "admin") {
    redirect("/login");
  }

  const analyticsData = await withTenantDb(session, async (tx) => {
    const [allAttendance, allMembers, allPayments] = await Promise.all([
      tx
        .select({
          id: attendance.id,
          checkedInAt: attendance.checkedInAt,
          method: attendance.method,
        })
        .from(attendance)
        .where(eq(attendance.tenantId, session.tenantId!)),

      tx
        .select({
          id: members.id,
          status: members.status,
          joinDate: members.joinDate,
        })
        .from(members)
        .where(eq(members.tenantId, session.tenantId!)),

      tx
        .select({
          id: payments.id,
          amount: payments.amount,
          method: payments.method,
          status: payments.status,
        })
        .from(payments)
        .where(eq(payments.tenantId, session.tenantId!)),
    ]);

    // Calculate members breakdown
    const totalMembers = allMembers.length;
    const activeMembers = allMembers.filter((m: { status: string }) => m.status === "active").length;
    const expiredMembers = allMembers.filter((m: { status: string }) => m.status === "expired").length;
    const frozenMembers = allMembers.filter((m: { status: string }) => m.status === "frozen").length;
    const retentionRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 100;

    // Calculate hourly check-in distribution (6 AM to 9 PM = 16 hours)
    const hourlyCounts: Record<number, number> = {};
    for (let h = 6; h <= 21; h++) {
      hourlyCounts[h] = 0;
    }

    const daysCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    allAttendance.forEach((att: { checkedInAt: Date | string }) => {
      const d = new Date(att.checkedInAt);
      const h = d.getHours();
      if (h >= 6 && h <= 21) {
        hourlyCounts[h] = (hourlyCounts[h] || 0) + 1;
      }
      const day = d.getDay();
      daysCounts[day] = (daysCounts[day] || 0) + 1;
    });

    let maxHourlyCount = 1;
    let peakHour = 18; // Default 6 PM
    let maxHourFound = -1;

    for (let h = 6; h <= 21; h++) {
      const count = hourlyCounts[h] || 0;
      if (count > maxHourlyCount) {
        maxHourlyCount = count;
      }
      if (count > maxHourFound) {
        maxHourFound = count;
        peakHour = h;
      }
    }

    const hourlyDistribution = Object.entries(hourlyCounts).map(([hStr, count]) => {
      const h = parseInt(hStr, 10);
      const hourLabel = h < 12 ? `${h}:00 AM` : h === 12 ? `12:00 PM` : `${h - 12}:00 PM`;
      return {
        hour: hourLabel,
        count,
        percentage: Math.round((count / maxHourlyCount) * 100),
      };
    });

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayDistribution = dayLabels.map((day, idx) => ({
      day,
      count: daysCounts[idx] || 0,
    }));

    const peakHourFormatted =
      peakHour < 12
        ? `${peakHour}:00 AM`
        : peakHour === 12
        ? `12:00 PM`
        : `${peakHour - 12}:00 PM`;

    // Revenue calculations
    let totalRevenue = 0;
    let manualRevenue = 0;
    let onlineRevenue = 0;

    allPayments.forEach((p: { status: string; amount: string; method: string }) => {
      if (p.status === "paid") {
        const val = Number(p.amount) || 0;
        totalRevenue += val;
        if (p.method === "manual") manualRevenue += val;
        if (p.method === "razorpay") onlineRevenue += val;
      }
    });

    const avgVisitsPerMember =
      activeMembers > 0 ? (allAttendance.length / activeMembers).toFixed(1) : "0";

    return {
      totalMembers,
      activeMembers,
      expiredMembers,
      frozenMembers,
      retentionRate,
      totalCheckIns: allAttendance.length,
      avgVisitsPerMember: Number(avgVisitsPerMember),
      peakHourLabel: peakHourFormatted,
      hourlyDistribution,
      dayDistribution,
      totalRevenue,
      manualRevenue,
      onlineRevenue,
    };
  });

  return <AnalyticsView data={analyticsData} />;
}
