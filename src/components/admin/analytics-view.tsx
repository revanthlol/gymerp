"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Clock,
  Wallet,
  Activity,
  BarChart3,
  UserCheck,
  UserX,
  ShieldAlert,
  ArrowUpRight,
  PieChart,
  CreditCard,
  Banknote,
  Globe,
} from "lucide-react";

interface AnalyticsViewProps {
  data: {
    totalMembers: number;
    activeMembers: number;
    expiredMembers: number;
    frozenMembers: number;
    retentionRate: number;
    totalCheckIns: number;
    avgVisitsPerMember: number;
    peakHourLabel: string;
    hourlyDistribution: Array<{ hour: string; count: number; percentage: number }>;
    dayDistribution: Array<{ day: string; count: number }>;
    totalRevenue: number;
    manualRevenue: number;
    onlineRevenue: number;
  };
}

export function AnalyticsView({ data }: AnalyticsViewProps) {
  const [timeRange, setTimeRange] = useState<"30d" | "7d" | "all">("30d");
  const [hoveredHour, setHoveredHour] = useState<{ hour: string; count: number } | null>(null);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  // SVG Area Chart points for hourly traffic
  const maxHourlyCount = useMemo(() => {
    return Math.max(...data.hourlyDistribution.map((h) => h.count), 1);
  }, [data.hourlyDistribution]);

  const chartPoints = useMemo(() => {
    const points = data.hourlyDistribution.map((item, idx) => {
      const x = (idx / (data.hourlyDistribution.length - 1)) * 500;
      const y = 140 - (item.count / maxHourlyCount) * 110;
      return { x, y, ...item };
    });
    return points;
  }, [data.hourlyDistribution, maxHourlyCount]);

  const svgPathD = useMemo(() => {
    if (chartPoints.length === 0) return "";
    let d = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const curr = chartPoints[i];
      const next = chartPoints[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return d;
  }, [chartPoints]);

  const areaPathD = useMemo(() => {
    if (chartPoints.length === 0) return "";
    const last = chartPoints[chartPoints.length - 1];
    return `${svgPathD} L ${last.x} 150 L ${chartPoints[0].x} 150 Z`;
  }, [svgPathD, chartPoints]);

  // Membership breakdown percentages
  const activePct = Math.round((data.activeMembers / (data.totalMembers || 1)) * 100);
  const expiredPct = Math.round((data.expiredMembers / (data.totalMembers || 1)) * 100);
  const frozenPct = Math.max(0, 100 - activePct - expiredPct);

  // Revenue breakdown percentages
  const totalRev = data.totalRevenue || 1;
  const onlinePct = Math.round((data.onlineRevenue / totalRev) * 100);
  const manualPct = Math.max(0, 100 - onlinePct);

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Facility Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Attendance flow rates, subscription retention health, and revenue telemetry.
          </p>
        </div>

        {/* Time range toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 border border-border rounded-xl">
          {(["7d", "30d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeRange === r
                  ? "bg-card border border-border text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid with Subtle Card Physics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Member Retention",
            value: `${data.retentionRate}%`,
            sub: `${data.activeMembers} active of ${data.totalMembers} registered`,
            icon: TrendingUp,
            accent: true,
          },
          {
            label: "Peak Traffic Hour",
            value: data.peakHourLabel,
            sub: "Highest check-in intensity",
            icon: Clock,
            accent: true,
          },
          {
            label: "Total Check-Ins",
            value: String(data.totalCheckIns),
            sub: `~${data.avgVisitsPerMember} visits per athlete`,
            icon: Activity,
            accent: false,
          },
          {
            label: "Net Recorded Intake",
            value: formatCurrency(data.totalRevenue),
            sub: `${formatCurrency(data.onlineRevenue)} online · ${formatCurrency(data.manualRevenue)} cash`,
            icon: Wallet,
            accent: false,
          },
        ].map(({ label, value, sub, icon: Icon, accent }) => (
          <div
            key={label}
            className="p-5 rounded-xl border border-border bg-card shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/25 cursor-default"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="size-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Primary Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Volume Curve Chart */}
        <div className="lg:col-span-8 rounded-xl border border-border bg-card p-6 space-y-5 shadow-none transition-all duration-200 hover:border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" />
                <span>Daily Attendance Traffic Curve</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hourly throughput and peak gym floor surge periods
              </p>
            </div>
            {hoveredHour ? (
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                {hoveredHour.hour}: {hoveredHour.count} check-ins
              </span>
            ) : (
              <span className="text-xs text-muted-foreground font-mono">
                Peak: {data.peakHourLabel}
              </span>
            )}
          </div>

          {/* SVG Smooth Curve Area Chart */}
          <div className="relative w-full h-44">
            <svg
              viewBox="0 0 500 150"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid guide lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="currentColor" strokeDasharray="3 3" className="text-border/60" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="currentColor" strokeDasharray="3 3" className="text-border/60" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="currentColor" strokeDasharray="3 3" className="text-border/60" />

              {/* Area fill */}
              {areaPathD && (
                <path d={areaPathD} fill="url(#attendanceGradient)" />
              )}

              {/* Spline stroke */}
              {svgPathD && (
                <path
                  d={svgPathD}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Data points */}
              {chartPoints.map((pt) => {
                const isHovered = hoveredHour?.hour === pt.hour;
                const isPeak = pt.hour === data.peakHourLabel;
                return (
                  <circle
                    key={pt.hour}
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5 : isPeak ? 4 : 2.5}
                    className={`transition-all duration-150 cursor-pointer ${
                      isHovered || isPeak
                        ? "fill-primary stroke-background stroke-2"
                        : "fill-primary/60"
                    }`}
                    onMouseEnter={() => setHoveredHour({ hour: pt.hour, count: pt.count })}
                    onMouseLeave={() => setHoveredHour(null)}
                  />
                );
              })}
            </svg>
          </div>

          {/* Time Labels */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
            <span>06:00 AM (Open)</span>
            <span>12:00 PM (Noon)</span>
            <span>05:00 PM (Rush)</span>
            <span>10:00 PM (Close)</span>
          </div>

          {/* Weekly volume by day bars */}
          <div className="pt-4 border-t border-border space-y-3">
            <h3 className="text-xs font-semibold text-foreground">Weekly Volume Distribution</h3>
            <div className="grid grid-cols-7 gap-2">
              {data.dayDistribution.map((d) => {
                const maxDay = Math.max(...data.dayDistribution.map((i) => i.count), 1);
                const pct = Math.round((d.count / maxDay) * 100);
                return (
                  <div
                    key={d.day}
                    className="p-2.5 rounded-xl bg-muted/40 border border-border text-center space-y-1.5 transition-colors hover:bg-muted/70"
                  >
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                      {d.day}
                    </p>
                    <p className="text-base font-bold font-mono text-foreground">{d.count}</p>
                    <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Membership Status & Revenue telemetry */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Membership Status Breakdown */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-none transition-all duration-200 hover:border-primary/20">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <span>Membership Status</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Active subscriptions vs churn risk</p>
            </div>

            {/* Segmented Progress Bar */}
            <div className="space-y-2">
              <div className="h-3 w-full rounded-full bg-muted flex overflow-hidden p-0.5">
                <div
                  className="h-full bg-primary rounded-l-full transition-all duration-500"
                  style={{ width: `${activePct}%` }}
                  title={`Active: ${activePct}%`}
                />
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${frozenPct}%` }}
                  title={`Frozen: ${frozenPct}%`}
                />
                <div
                  className="h-full bg-destructive rounded-r-full transition-all duration-500"
                  style={{ width: `${expiredPct}%` }}
                  title={`Expired: ${expiredPct}%`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary" />
                  Active {activePct}%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Frozen {frozenPct}%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-destructive" />
                  Expired {expiredPct}%
                </span>
              </div>
            </div>

            {/* Detailed Rows */}
            <div className="space-y-2 pt-2">
              {[
                {
                  label: "Active Members",
                  icon: UserCheck,
                  count: data.activeMembers,
                  sub: "Current valid subscriptions",
                  iconClass: "bg-primary/10 text-primary",
                  numClass: "text-primary",
                },
                {
                  label: "Expired Passes",
                  icon: UserX,
                  count: data.expiredMembers,
                  sub: "Awaiting renewal or renewal nudge",
                  iconClass: "bg-destructive/10 text-destructive",
                  numClass: "text-destructive",
                },
                {
                  label: "Frozen / On-Hold",
                  icon: ShieldAlert,
                  count: data.frozenMembers,
                  sub: "Temporary freeze requested",
                  iconClass: "bg-amber-500/10 text-amber-500",
                  numClass: "text-amber-500",
                },
              ].map(({ label, icon: Icon, count, sub, iconClass, numClass }) => (
                <div
                  key={label}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-7 rounded-lg flex items-center justify-center ${iconClass}`}>
                      <Icon className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{label}</p>
                      <p className="text-[11px] text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold font-mono ${numClass}`}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Stream Mix */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-none transition-all duration-200 hover:border-primary/20">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Wallet className="size-4 text-primary" />
                <span>Revenue Intake Mix</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Online Razorpay vs Manual Desk Cash</p>
            </div>

            <div className="space-y-3">
              {/* Online Payment Stream */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="size-3.5 text-primary" />
                    <span className="text-xs font-medium text-foreground">Razorpay Online</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-primary">
                    {formatCurrency(data.onlineRevenue)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${onlinePct}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground block text-right">
                  {onlinePct}% of recorded total
                </span>
              </div>

              {/* Manual POS / Cash */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Front Desk Cash / POS</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-foreground">
                    {formatCurrency(data.manualRevenue)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-muted-foreground/40 h-full rounded-full transition-all duration-500"
                    style={{ width: `${manualPct}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground block text-right">
                  {manualPct}% of recorded total
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
