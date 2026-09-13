"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Activity,
  CreditCard,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Search,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TurnstileQrDialog } from "@/components/admin/turnstile-qr-dialog";
import { members, membershipPlans, attendance, payments, memberships } from "@/lib/db/schema";

type MemberRecord = typeof members.$inferSelect;
type PlanRecord = typeof membershipPlans.$inferSelect;
type AttendanceRecord = typeof attendance.$inferSelect;
type PaymentRecord = typeof payments.$inferSelect;
type MembershipRecord = typeof memberships.$inferSelect;

interface AdminDashboardViewProps {
  gymName: string;
  adminEmail: string;
  adminName?: string;
  membersList: MemberRecord[];
  plansList: PlanRecord[];
  attendanceList: AttendanceRecord[];
  paymentsList: PaymentRecord[];
  membershipsList: MembershipRecord[];
}

export function AdminDashboardView({
  gymName,
  adminEmail,
  adminName,
  membersList,
  plansList,
  attendanceList,
  paymentsList,
  membershipsList,
}: AdminDashboardViewProps) {
  const [actionFilter, setActionFilter] = useState("");

  // KPI: Active members
  const activeMembers = useMemo(
    () => membersList.filter((m) => m.status === "active").length,
    [membersList]
  );
  const inactiveMembers = membersList.length - activeMembers;
  const activeRate = membersList.length > 0
    ? Math.round((activeMembers / membersList.length) * 100)
    : 0;

  // KPI: Today's check-ins
  const todayCheckIns = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return attendanceList.filter((a) =>
      new Date(a.checkedInAt).toISOString().slice(0, 10) === todayStr
    ).length;
  }, [attendanceList]);

  // KPI: This month's revenue
  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return paymentsList
      .filter((p) => p.status === "paid" && new Date(p.createdAt) >= monthStart)
      .reduce((acc, p) => acc + parseFloat(p.amount), 0);
  }, [paymentsList]);

  // KPI: Pending payments
  const overduePayments = useMemo(
    () => paymentsList.filter((p) => p.status === "pending"),
    [paymentsList]
  );

  // 7-day attendance bar chart
  const weeklyAttendance = useMemo(() => {
    const days: { label: string; dateStr: string; count: number; isToday: boolean }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const count = attendanceList.filter(
        (a) => new Date(a.checkedInAt).toISOString().slice(0, 10) === dateStr
      ).length;
      days.push({ label, dateStr, count, isToday: i === 0 });
    }
    const maxCount = Math.max(...days.map((d) => d.count), 1);
    const totalCount = days.reduce((acc, d) => acc + d.count, 0);
    return { days, maxCount, totalCount };
  }, [attendanceList]);

  // Expiring memberships within 7 days
  const expiringMemberships = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() + 7);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const todayStr = now.toISOString().slice(0, 10);
    return membershipsList
      .filter((ms) => ms.status === "active" && ms.endDate >= todayStr && ms.endDate <= cutoffStr)
      .sort((a, b) => a.endDate.localeCompare(b.endDate));
  }, [membershipsList]);

  const expiringWithNames = useMemo(() => {
    return expiringMemberships.map((ms) => {
      const member = membersList.find((m) => m.id === ms.memberId);
      const plan = plansList.find((p) => p.id === ms.planId);
      return {
        ...ms,
        memberName: member?.fullName || "Unknown",
        memberPhone: member?.phone || "",
        planName: plan?.name || "Plan",
      };
    });
  }, [expiringMemberships, membersList, plansList]);

  const overdueWithNames = useMemo(() => {
    return overduePayments.map((p) => {
      const member = membersList.find((m) => m.id === p.memberId);
      return { ...p, memberName: member?.fullName || "Unknown", memberPhone: member?.phone || "" };
    });
  }, [overduePayments, membersList]);

  const filteredExpiring = useMemo(() => {
    if (!actionFilter.trim()) return expiringWithNames;
    const q = actionFilter.toLowerCase();
    return expiringWithNames.filter(
      (r) => r.memberName.toLowerCase().includes(q) || r.memberPhone.includes(q)
    );
  }, [expiringWithNames, actionFilter]);

  const filteredOverdue = useMemo(() => {
    if (!actionFilter.trim()) return overdueWithNames;
    const q = actionFilter.toLowerCase();
    return overdueWithNames.filter(
      (r) => r.memberName.toLowerCase().includes(q) || r.memberPhone.includes(q)
    );
  }, [overdueWithNames, actionFilter]);

  const hasActions = expiringWithNames.length > 0 || overdueWithNames.length > 0;

  const daysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex flex-col gap-8 w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{gymName}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TurnstileQrDialog />
          <Link href="/admin/members">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Users className="size-3.5" />
              Members
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border border border-border rounded-xl overflow-hidden bg-card">
        <div className="flex flex-col gap-1 p-5">
          <span className="text-xs text-muted-foreground font-medium">Active Members</span>
          <span className="text-3xl font-bold tracking-tight text-foreground leading-none mt-1">{activeMembers}</span>
          <span className="text-xs text-muted-foreground mt-1">
            {membersList.length} enrolled · {inactiveMembers} expired
          </span>
        </div>

        <div className="flex flex-col gap-1 p-5">
          <span className="text-xs text-muted-foreground font-medium">Today's Check-ins</span>
          <span className="text-3xl font-bold tracking-tight text-foreground leading-none mt-1">{todayCheckIns}</span>
          <span className="text-xs text-muted-foreground mt-1">{attendanceList.length} total visits</span>
        </div>

        <div className="flex flex-col gap-1 p-5">
          <span className="text-xs text-muted-foreground font-medium">Revenue This Month</span>
          <span className="text-3xl font-bold tracking-tight text-foreground leading-none mt-1">
            ₹{monthlyRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            {paymentsList.filter((p) => p.status === "paid").length} settled payments
          </span>
        </div>

        <div className="flex flex-col gap-1 p-5">
          <span className="text-xs text-muted-foreground font-medium">Pending Payments</span>
          <span className={`text-3xl font-bold tracking-tight leading-none mt-1 ${
            overduePayments.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
          }`}>
            {overduePayments.length}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            {overduePayments.length === 0 ? "All clear" : "awaiting collection"}
          </span>
        </div>
      </div>

      {/* Chart + Member Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Bar Chart */}
        <Card className="lg:col-span-8 border border-border bg-card shadow-none">
          <CardHeader className="pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  Check-in Activity · Last 7 Days
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {weeklyAttendance.totalCount} visits this week
                </CardDescription>
              </div>
              <Link href="/admin/attendance" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <span>View log</span>
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative h-40 w-full flex items-end justify-between gap-1.5 sm:gap-3">
              <div className="absolute inset-x-0 top-0 border-b border-dashed border-border/50 pointer-events-none" />
              <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-border/50 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 border-b border-border pointer-events-none" />
              {weeklyAttendance.days.map((item) => {
                const heightPercent = weeklyAttendance.maxCount > 0
                  ? Math.max(Math.round((item.count / weeklyAttendance.maxCount) * 100), item.count > 0 ? 8 : 4)
                  : 4;
                return (
                  <div key={item.dateStr} className="flex-1 flex flex-col items-center h-full justify-end group cursor-default z-10">
                    <span className="text-[11px] font-medium text-foreground bg-card border border-border px-1.5 py-0.5 rounded shadow-sm mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.count}
                    </span>
                    <div className="w-full max-w-[44px] rounded-t-md relative overflow-hidden flex items-end h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          item.isToday ? "bg-primary" : item.count > 0 ? "bg-primary/35" : "bg-muted"
                        }`}
                      />
                    </div>
                    <span className={`text-xs mt-2.5 font-medium ${item.isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Member Health */}
        <Card className="lg:col-span-4 border border-border bg-card shadow-none">
          <CardHeader className="pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="size-4 text-primary" />
                Member Health
              </CardTitle>
              <Link href="/admin/members" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <span>All</span>
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-5 flex flex-col gap-5">
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-semibold text-foreground">{activeMembers} · {activeRate}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${activeRate}%` }} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Expired / Frozen</span>
                  <span className="font-semibold text-foreground">{inactiveMembers} · {100 - activeRate}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-muted-foreground/30 rounded-full transition-all duration-500" style={{ width: `${100 - activeRate}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex flex-col gap-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Expiring in 7 days</span>
                <span className={`font-semibold ${expiringMemberships.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                  {expiringMemberships.length}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Pending payments</span>
                <span className={`font-semibold ${overduePayments.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                  {overduePayments.length}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Active plans</span>
                <span className="font-semibold text-foreground">{plansList.length}</span>
              </div>
            </div>

            <Button asChild variant="outline" size="sm" className="w-full text-xs h-8 mt-auto">
              <Link href="/admin/members">
                <span>View all members</span>
                <ArrowUpRight className="size-3 ml-1.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Action Needed */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Action Needed</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasActions
                ? `${expiringWithNames.length} expiring · ${overdueWithNames.length} unpaid`
                : "Nothing urgent — all memberships and payments are in order"}
            </p>
          </div>
          {hasActions && (
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter by name or phone..."
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="h-8 w-full pl-8 pr-3 text-xs rounded-lg bg-muted/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          )}
        </div>

        {!hasActions ? (
          <div className="border border-border rounded-xl bg-card p-8 flex flex-col items-center gap-2 text-center">
            <CheckCircle2 className="size-6 text-primary opacity-60" />
            <p className="text-sm text-muted-foreground">No expiring memberships or pending payments</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Expiring memberships */}
            <Card className="border border-border bg-card shadow-none">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertCircle className="size-4 text-amber-500 dark:text-amber-400" />
                  Expiring Within 7 Days
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    {filteredExpiring.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filteredExpiring.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-4">No matches</p>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredExpiring.map((ms) => {
                      const days = daysUntil(ms.endDate);
                      return (
                        <div key={ms.id} className="flex items-center justify-between px-4 py-3 gap-3 border-l-2 border-l-amber-400 dark:border-l-amber-500 hover:bg-muted/40 transition-colors">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-xs font-medium text-foreground truncate">{ms.memberName}</span>
                            <span className="text-[11px] text-muted-foreground">{ms.planName} · {ms.memberPhone}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`}
                              </span>
                              <span className="block text-[10px] text-muted-foreground">
                                {new Date(ms.endDate).toLocaleDateString("en-IN")}
                              </span>
                            </div>
                            <Link href="/admin/members" className="text-[11px] text-primary hover:underline font-medium">
                              Renew
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending payments */}
            <Card className="border border-border bg-card shadow-none">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="size-4 text-red-500" />
                  Pending Payments
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    {filteredOverdue.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filteredOverdue.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-4">No matches</p>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredOverdue.map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-4 py-3 gap-3 border-l-2 border-l-red-400 hover:bg-muted/40 transition-colors">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-xs font-medium text-foreground truncate">{p.memberName}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {p.method === "razorpay" ? "Razorpay" : "Manual"} · {p.memberPhone}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-semibold text-foreground">
                              ₹{parseFloat(p.amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                            </span>
                            <span className="block text-[10px] text-muted-foreground">
                              {new Date(p.createdAt).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                          <Link href="/admin/payments" className="text-[11px] text-primary hover:underline font-medium">
                            Collect
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}
      </div>

    </div>
  );
}
