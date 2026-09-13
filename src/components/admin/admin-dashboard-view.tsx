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
  Sparkles,
  Search,
  CheckCircle2,
  Copy,
  Check,
  PackageCheck,
  ShieldCheck,
  CalendarDays,
  Zap,
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

  const getGreetingIcon = () => {
    if (greeting === "Good Morning" || greeting === "Good Afternoon") {
      return <Sun className="size-5 text-amber-400" />;
    }
    return <Moon className="size-5 text-indigo-400" />;
  };

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

    const maxCount = Math.max(...days.map((d) => d.count), 1);
    return { days, maxCount };
  }, [attendanceList]);

  const busiestDay = useMemo(() => {
    if (weeklyAttendance.days.length === 0) return "N/A";
    const sorted = [...weeklyAttendance.days].sort((a, b) => b.count - a.count);
    return sorted[0].count > 0 ? `${sorted[0].label} (${sorted[0].count})` : "Weekday evening";
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
    toast.success("Kiosk pass code copied to clipboard");
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
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Modern Overview Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              {greeting}, {gymName}
            </h1>
            <span className="inline-flex items-center justify-center p-1 rounded-full bg-muted/60 border border-border/60">
              {getGreetingIcon()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Facility operational status, member turnstile volume, and revenue health.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Link href="/admin/onboarding">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 gap-2 text-xs font-medium border-border/80 bg-background hover:bg-muted/60"
            >
              <Sliders className="size-3.5 text-primary" />
              <span>Setup Wizard</span>
            </Button>
          </Link>
          <TurnstileQrDialog />
          <Link href="/admin/clients">
            <Button
              size="sm"
              className="h-9 px-3.5 gap-2 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Users className="size-3.5" />
              <span>Manage Athletes</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Modern 4-Card KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Athletes */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Active Athletes
              </span>
              <div className="border border-border/80 bg-muted/40 p-2 rounded-lg text-primary">
                <Users className="size-4" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-semibold tracking-tight text-foreground font-mono">
                  {activeMembers}
                </span>
                <Badge variant={activeRate >= 50 ? "success" : "warning"} className="text-[11px]">
                  {activeRate}% active
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {membersList.length} enrolled · {inactiveMembers} expired/frozen
              </span>
            </div>
            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
              <Link
                href="/admin/clients"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <span>View member roster</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Today's Check-Ins */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Today&apos;s Check-Ins
              </span>
              <div className="border border-border/80 bg-muted/40 p-2 rounded-lg text-emerald-400">
                <Activity className="size-4" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-semibold tracking-tight text-foreground font-mono">
                  {todayCheckIns.length}
                </span>
                <Badge variant="outline" className="text-[11px] gap-1.5 border-emerald-500/30 text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Turnstile
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {attendanceList.length} cumulative facility visits
              </span>
            </div>
            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
              <Link
                href="/admin/attendance"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <span>Live attendance feed</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Settled Revenue */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Settled Revenue
              </span>
              <div className="border border-border/80 bg-muted/40 p-2 rounded-lg text-amber-400">
                <CreditCard className="size-4" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-semibold tracking-tight text-foreground font-mono">
                  ₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <Badge variant="secondary" className="text-[11px]">
                  {settledPayments.length} txns
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {paymentsList.length} logged invoices & collections
              </span>
            </div>
            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
              <Link
                href="/admin/payments"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <span>View transactions</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Configured Plans */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Active Catalog
              </span>
              <div className="border border-border/80 bg-muted/40 p-2 rounded-lg text-indigo-400">
                <PackageCheck className="size-4" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-semibold tracking-tight text-foreground font-mono">
                  {plansList.length}
                </span>
                <Badge variant="outline" className="text-[11px]">
                  Tier Catalog
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                Standard & recurring programs
              </span>
            </div>
            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
              <Link
                href="/admin/plans"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <span>Manage plan tiers</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Operational Grid (Col 12 layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 7-Day Traffic & Peak Activity (8 cols) */}
        <Card className="lg:col-span-8 border-border/60 bg-card/60 flex flex-col">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  <span>Facility Traffic & Check-In Velocity</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Daily member scan activity over the past 7 days
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs gap-1.5 self-start sm:self-auto py-1">
                <Clock className="size-3 text-primary" />
                <span>Peak: 6:00 PM – 8:30 PM</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between gap-6">
            {/* 7-Day Bar Chart */}
            <div className="flex flex-col gap-3">
              <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2">
                {weeklyAttendance.days.map((item) => {
                  const heightPercent = weeklyAttendance.maxCount > 0
                    ? Math.max(Math.round((item.count / weeklyAttendance.maxCount) * 100), 8)
                    : 8;

                  return (
                    <div
                      key={item.dateStr}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                    >
                      <div className="text-[11px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mb-1.5">
                        {item.count}
                      </div>
                      <div className="w-full max-w-[42px] bg-muted/50 rounded-t-md relative overflow-hidden flex items-end transition-all h-full">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-md transition-all duration-500 ${
                            item.isToday
                              ? "bg-primary shadow-[0_0_12px_rgba(62,207,142,0.35)]"
                              : "bg-muted-foreground/30 hover:bg-primary/70"
                          }`}
                        />
                      </div>
                      <span
                        className={`text-xs mt-2.5 font-medium ${
                          item.isToday ? "text-primary font-bold" : "text-muted-foreground"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Insights Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/40">
              <div className="p-3 rounded-lg bg-muted/20 border border-border/40 flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground uppercase font-medium">Busiest Day</span>
                <span className="text-sm font-semibold text-foreground font-mono">{busiestDay}</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border/40 flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground uppercase font-medium">Kiosk Hardware</span>
                <span className="text-sm font-semibold text-emerald-400 font-mono flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Online & Scanning
                </span>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border/40 flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground uppercase font-medium">Rotating QR Pass</span>
                <span className="text-sm font-semibold text-foreground font-mono flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-primary" />
                  Auto-Refreshing
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Roster Health & Plan Distribution (4 cols) */}
        <Card className="lg:col-span-4 border-border/60 bg-card/60 flex flex-col">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <span>Roster Health</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Pass status breakdown and membership status
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between gap-5">
            {/* Status Bars */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    Active Members
                  </span>
                  <span className="font-mono font-medium text-foreground">
                    {activeMembers} ({activeRate}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${activeRate}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-400" />
                    Expired / Due Passes
                  </span>
                  <span className="font-mono font-medium text-foreground">
                    {inactiveMembers} ({membersList.length > 0 ? Math.round((inactiveMembers / membersList.length) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${membersList.length > 0 ? Math.round((inactiveMembers / membersList.length) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Popular Catalog Tiers */}
            <div className="flex flex-col gap-2.5 pt-4 border-t border-border/40">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Configured Tiers
              </span>
              <div className="flex flex-col gap-2">
                {plansList.slice(0, 3).map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/40 text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{plan.name}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{plan.durationDays} days access</span>
                    </div>
                    <span className="font-mono font-semibold text-foreground">
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
              className="w-full text-xs h-9 border-border/80 hover:bg-muted/60"
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
              Admission packages active for POS registration and turnstile validation
            </p>
          </div>
          <Link href="/admin/plans">
            <Button variant="outline" size="sm" className="text-xs h-8 border-border/80 hover:bg-muted/60">
              <span>Edit Plans</span>
              <ArrowUpRight className="size-3 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plansList.map((plan) => (
            <Card key={plan.id} className="border-border/60 bg-card/60 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-foreground">{plan.name}</CardTitle>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {plan.durationDays} Days
                  </Badge>
                </div>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {plan.description || "Full access facility admission pass with automated kiosk validation."}
                </CardDescription>
              </CardHeader>

              <CardContent className="py-2 flex flex-col gap-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-foreground">
                    ₹{parseFloat(plan.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">/ duration</span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    <span>Turnstile auto QR validation</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    <span>Automated expiration enforcement</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-3 border-t border-border/40 text-xs text-muted-foreground flex justify-between items-center">
                <span className="font-mono text-[11px]">Managed Tier</span>
                <Badge variant="outline" className="text-[10px]">
                  Catalog Active
                </Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* 5. Registered Athletes & Check-In Roster Table */}
      <Card className="border-border/60 bg-card/60">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <span>Registered Athletes & Members</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Roster of active pass holders, digital pass tokens, and registration records
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
                  className="h-8 pl-8 pr-3 text-xs rounded-md bg-muted/40 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-52 sm:w-64"
                />
              </div>
              <Link href="/admin/clients">
                <Button size="sm" variant="outline" className="h-8 text-xs border-border/80">
                  Full Roster
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/40 bg-muted/20 hover:bg-muted/20">
                <TableHead className="text-xs font-semibold">Athlete Name</TableHead>
                <TableHead className="text-xs font-semibold">Phone Contact</TableHead>
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
                  <TableRow key={member.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
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

                    <TableCell className="font-mono text-xs text-muted-foreground">
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
                        className="font-mono text-[11px] px-2 py-0.5 rounded bg-muted/60 hover:bg-muted border border-border/60 text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedToken === member.qrToken ? (
                          <Check className="size-3 text-primary" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                        <span>{member.qrToken.slice(0, 8)}...</span>
                      </button>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {member.joinDate ? new Date(member.joinDate).toLocaleDateString("en-IN") : "—"}
                    </TableCell>

                    <TableCell className="text-right">
                      <Link
                        href={`/admin/clients`}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        View Details
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
