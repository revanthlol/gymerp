"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Activity,
  CreditCard,
  Sliders,
  Sun,
  Moon,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Search,
  CheckCircle2,
  Copy,
  Check,
  PackageCheck,
  ShieldCheck,
  CalendarDays,
  Zap,
  ChevronRight,
  UserCheck,
  UserX,
  Dumbbell,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TurnstileQrDialog } from "@/components/admin/turnstile-qr-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { members, membershipPlans, attendance, payments } from "@/lib/db/schema";

type MemberRecord = typeof members.$inferSelect;
type PlanRecord = typeof membershipPlans.$inferSelect;
type AttendanceRecord = typeof attendance.$inferSelect;
type PaymentRecord = typeof payments.$inferSelect;

interface AdminDashboardViewProps {
  gymName: string;
  adminEmail: string;
  adminName?: string;
  membersList: MemberRecord[];
  plansList: PlanRecord[];
  attendanceList: AttendanceRecord[];
  paymentsList: PaymentRecord[];
}

export function AdminDashboardView({
  gymName,
  adminEmail,
  adminName,
  membersList,
  plansList,
  attendanceList,
  paymentsList,
}: AdminDashboardViewProps) {
  const [greeting, setGreeting] = useState("Good Day");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good Morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon");
    } else if (hour >= 17 && hour < 21) {
      setGreeting("Good Evening");
    } else {
      setGreeting("Good Night");
    }
  }, []);

  // Metrics calculations
  const activeMembers = useMemo(
    () => membersList.filter((m) => m.status === "active").length,
    [membersList]
  );
  const inactiveMembers = membersList.length - activeMembers;
  const activeRate = membersList.length > 0
    ? Math.round((activeMembers / membersList.length) * 100)
    : 0;

  // Today's attendance
  const todayCheckIns = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return attendanceList.filter((a) => {
      const checkInDate = new Date(a.checkedInAt).toISOString().slice(0, 10);
      return checkInDate === todayStr;
    });
  }, [attendanceList]);

  // Settled revenue
  const totalRevenue = useMemo(() => {
    return paymentsList.reduce((acc, p) => {
      return acc + (p.status === "paid" ? parseFloat(p.amount) : 0);
    }, 0);
  }, [paymentsList]);

  const settledPayments = useMemo(
    () => paymentsList.filter((p) => p.status === "paid"),
    [paymentsList]
  );

  // 7-day attendance traffic analysis
  const weeklyAttendance = useMemo(() => {
    const days: { label: string; dateStr: string; count: number; isToday: boolean }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const isToday = i === 0;

      const count = attendanceList.filter((a) => {
        return new Date(a.checkedInAt).toISOString().slice(0, 10) === dateStr;
      }).length;

      days.push({ label, dateStr, count, isToday });
    }

    const totalCount = days.reduce((acc, d) => acc + d.count, 0);
    const maxCount = Math.max(...days.map((d) => d.count), 1);
    return { days, maxCount, totalCount };
  }, [attendanceList]);

  const busiestDay = useMemo(() => {
    if (weeklyAttendance.days.length === 0) return "Evening peak";
    const sorted = [...weeklyAttendance.days].sort((a, b) => b.count - a.count);
    return sorted[0].count > 0 ? `${sorted[0].label} (${sorted[0].count} visits)` : "Evening (6-8 PM)";
  }, [weeklyAttendance]);

  // Filtered members table
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return membersList.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return membersList
      .filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          m.qrToken.includes(q)
      )
      .slice(0, 10);
  }, [membersList, searchQuery]);

  const handleCopyPass = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success("Pass token copied to clipboard");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex flex-col gap-6 w-full font-sans">
      {/* 1. Header with contextual greeting & actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {greeting}, {gymName}
            </h1>
            <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-normal border-border bg-muted/40">
              <span className="size-1.5 rounded-full bg-primary" />
              Live Operations
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time facility check-ins, active memberships, and payment collections.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <ThemeToggle />
          <Link href="/admin/onboarding">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 gap-2 text-xs font-medium border-border bg-background hover:bg-muted"
            >
              <Sliders className="size-3.5 text-muted-foreground" />
              <span>Setup Wizard</span>
            </Button>
          </Link>
          <TurnstileQrDialog />
          <Link href="/admin/clients">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 gap-2 text-xs font-medium border-border bg-background hover:bg-muted"
            >
              <Users className="size-3.5 text-primary" />
              <span>Manage Athletes</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Four Clean KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Athletes */}
        <Card className="border border-border bg-card shadow-xs">
          <CardContent className="p-6 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Active Athletes
              </span>
              <div className="border border-border p-2 rounded-lg bg-muted/50 text-muted-foreground">
                <Users className="size-4" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {activeMembers}
                </span>
                <Badge variant={activeRate >= 50 ? "success" : "warning"} className="text-xs">
                  {activeRate}% active
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {membersList.length} enrolled · {inactiveMembers} expired/frozen
              </span>
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <Link
                href="/admin/clients"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <span>View member roster</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Today's Check-Ins */}
        <Card className="border border-border bg-card shadow-xs">
          <CardContent className="p-6 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Today&apos;s Check-Ins
              </span>
              <div className="border border-border p-2 rounded-lg bg-muted/50 text-muted-foreground">
                <Activity className="size-4" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {todayCheckIns.length}
                </span>
                <Badge variant="outline" className="text-xs gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Turnstile
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {attendanceList.length} cumulative facility visits
              </span>
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <Link
                href="/admin/attendance"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <span>Live attendance feed</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Settled Revenue */}
        <Card className="border border-border bg-card shadow-xs">
          <CardContent className="p-6 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Settled Revenue
              </span>
              <div className="border border-border p-2 rounded-lg bg-muted/50 text-muted-foreground">
                <CreditCard className="size-4" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  ₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {settledPayments.length} paid
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {paymentsList.length} total logged invoices
              </span>
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <Link
                href="/admin/payments"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <span>Billing transactions</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Configured Plans */}
        <Card className="border border-border bg-card shadow-xs">
          <CardContent className="p-6 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Active Plans
              </span>
              <div className="border border-border p-2 rounded-lg bg-muted/50 text-muted-foreground">
                <PackageCheck className="size-4" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {plansList.length}
                </span>
                <Badge variant="outline" className="text-xs">
                  Tier Catalog
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                Active membership tiers
              </span>
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <Link
                href="/admin/plans"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <span>Manage programs</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Operational Grid: Traffic Activity & Roster Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 7-Day Attendance Activity (8 cols) */}
        <Card className="lg:col-span-8 border border-border bg-card shadow-xs flex flex-col">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  <span>Facility Check-In Activity</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Daily turnstile entries over the past 7 days
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs gap-1.5 py-1 font-normal">
                  <Clock className="size-3 text-muted-foreground" />
                  <span>Peak: 6:00 PM – 8:30 PM</span>
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 flex-1 flex flex-col justify-between gap-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground uppercase font-medium">Today</span>
                <span className="text-lg font-bold text-foreground">{todayCheckIns.length} visits</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground uppercase font-medium">7-Day Total</span>
                <span className="text-lg font-bold text-foreground">{weeklyAttendance.totalCount} visits</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground uppercase font-medium">Busiest Day</span>
                <span className="text-lg font-bold text-foreground">{busiestDay}</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground uppercase font-medium">Kiosk Gate</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>
            </div>

            {/* 7-Day Visual Bar Chart with Baseline & Guidelines */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="relative h-44 w-full flex items-end justify-between gap-2 sm:gap-4 px-2">
                {/* Horizontal Guide Lines */}
                <div className="absolute inset-x-0 top-0 border-b border-dashed border-border/40 pointer-events-none" />
                <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-border/40 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 border-b border-border pointer-events-none" />

                {weeklyAttendance.days.map((item) => {
                  const rawPercent = weeklyAttendance.maxCount > 0
                    ? Math.round((item.count / weeklyAttendance.maxCount) * 100)
                    : 0;
                  const heightPercent = Math.max(rawPercent, 6);

                  return (
                    <div
                      key={item.dateStr}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer z-10"
                    >
                      {/* Count Hover Tooltip */}
                      <span className="text-[11px] font-medium text-foreground bg-muted border border-border px-1.5 py-0.5 rounded shadow-xs mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.count}
                      </span>

                      {/* Bar Track & Fill */}
                      <div className="w-full max-w-[48px] bg-muted/40 hover:bg-muted/60 rounded-t-md relative overflow-hidden flex items-end h-full transition-colors">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-md transition-all duration-500 ${
                            item.isToday
                              ? "bg-primary shadow-xs"
                              : item.count > 0
                              ? "bg-primary/70"
                              : "bg-muted-foreground/20"
                          }`}
                        />
                      </div>

                      {/* Weekday Label */}
                      <span
                        className={`text-xs mt-3 font-medium transition-colors ${
                          item.isToday
                            ? "text-primary font-bold"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Roster Distribution (4 cols) */}
        <Card className="lg:col-span-4 border border-border bg-card shadow-xs flex flex-col">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <span>Roster Health</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Membership status and subscription lifecycle
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 flex-1 flex flex-col justify-between gap-5">
            {/* Status Breakdown Bars */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Active Members
                  </span>
                  <span className="font-semibold text-foreground">
                    {activeMembers} ({activeRate}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${activeRate}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Expired / Due Passes
                  </span>
                  <span className="font-semibold text-foreground">
                    {inactiveMembers} ({membersList.length > 0 ? Math.round((inactiveMembers / membersList.length) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${membersList.length > 0 ? Math.round((inactiveMembers / membersList.length) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Configured Tiers List */}
            <div className="flex flex-col gap-2.5 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Active Plans
                </span>
                <Link href="/admin/plans" className="text-xs text-primary hover:underline">
                  View All
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {plansList.slice(0, 3).map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{plan.name}</span>
                      <span className="text-[11px] text-muted-foreground">{plan.durationDays} days access</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      ₹{parseFloat(plan.price).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full text-xs h-9 border-border hover:bg-muted"
            >
              <Link href="/admin/clients">
                <span>View Full Athlete Directory</span>
                <ArrowUpRight className="size-3.5 ml-1.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 4. Configured Membership Plans Showcase */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold text-foreground">Configured Membership Plans</h2>
            <p className="text-xs text-muted-foreground">
              Programs available for front-desk enrolment and automated turnstile admission
            </p>
          </div>
          <Link href="/admin/plans">
            <Button variant="outline" size="sm" className="text-xs h-8 border-border hover:bg-muted">
              <span>Edit Plans</span>
              <ArrowUpRight className="size-3 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plansList.map((plan) => (
            <Card key={plan.id} className="border border-border bg-card shadow-xs flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-foreground">{plan.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {plan.durationDays} Days
                  </Badge>
                </div>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {plan.description || "Full access facility admission pass with automated turnstile validation."}
                </CardDescription>
              </CardHeader>

              <CardContent className="py-2 flex flex-col gap-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-foreground">
                    ₹{parseFloat(plan.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-muted-foreground">/ duration</span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    <span>Automated QR kiosk pass</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    <span>Turnstile access control</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-3 border-t border-border text-xs text-muted-foreground flex justify-between items-center">
                <span className="text-[11px]">Managed Program</span>
                <Badge variant="outline" className="text-[10px]">
                  Active
                </Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* 5. Registered Athletes & Check-In Roster Table */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <span>Registered Athletes & Members</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Roster of registered members with status, digital pass codes, and registration dates
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter athlete name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-3 text-xs rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-52 sm:w-64"
                />
              </div>
              <Link href="/admin/clients">
                <Button size="sm" variant="outline" className="h-8 text-xs border-border">
                  Full Roster
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-semibold">Athlete Name</TableHead>
                <TableHead className="text-xs font-semibold">Phone</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold">Kiosk Pass Code</TableHead>
                <TableHead className="text-xs font-semibold">Joined Date</TableHead>
                <TableHead className="text-xs font-semibold text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-xs text-muted-foreground">
                    {searchQuery ? "No matching athletes found for this search filter." : "No registered members yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                            {getInitials(member.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-foreground">{member.fullName}</span>
                          {member.email && (
                            <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                              {member.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {member.phone}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          member.status === "active"
                            ? "success"
                            : member.status === "expired"
                            ? "destructive"
                            : "warning"
                        }
                        className="text-[11px] capitalize"
                      >
                        {member.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <button
                        onClick={() => handleCopyPass(member.qrToken)}
                        title="Click to copy pass code"
                        className="font-mono text-[11px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 border border-border text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedToken === member.qrToken ? (
                          <Check className="size-3 text-primary" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                        <span>{member.qrToken.slice(0, 8)}...</span>
                      </button>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {member.joinDate ? new Date(member.joinDate).toLocaleDateString("en-IN") : "—"}
                    </TableCell>

                    <TableCell className="text-right">
                      <Link
                        href="/admin/clients"
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        View Dossier
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
