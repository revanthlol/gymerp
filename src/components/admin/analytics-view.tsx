"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Clock,
  Wallet,
  Activity,
  BarChart3,
  Award,
  UserCheck,
  UserX,
  ShieldAlert,
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

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Attendance patterns, retention health, and revenue overview.
          </p>
        </div>
        {/* Time range toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 border border-border rounded-xl">
          {(["7d", "30d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
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

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Retention",
            value: `${data.retentionRate}%`,
            sub: `${data.activeMembers} active of ${data.totalMembers}`,
            icon: TrendingUp,
            accent: true,
          },
          {
            label: "Peak Hour",
            value: data.peakHourLabel,
            sub: "Highest traffic window",
            icon: Clock,
            accent: true,
          },
          {
            label: "Total Check-Ins",
            value: String(data.totalCheckIns),
            sub: `~${data.avgVisitsPerMember} visits per member`,
            icon: Activity,
            accent: false,
          },
          {
            label: "Revenue",
            value: formatCurrency(data.totalRevenue),
            sub: `${formatCurrency(data.onlineRevenue)} online · ${formatCurrency(data.manualRevenue)} cash`,
            icon: Wallet,
            accent: false,
          },
        ].map(({ label, value, sub, icon: Icon, accent }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <Icon className="size-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly histogram */}
        <div className="lg:col-span-8 rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" />
                Hourly Attendance Traffic
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Check-ins by hour of day</p>
            </div>
            <span className="text-xs text-muted-foreground">6 AM — 10 PM</span>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 items-end h-40 pb-2 border-b border-border">
              {data.hourlyDistribution.map((item) => {
                const isPeak = item.hour === data.peakHourLabel;
                const barHeight = Math.max(8, item.percentage);
                return (
                  <div key={item.hour} className="flex flex-col items-center h-full justify-end group">
                    <div className="relative w-full flex flex-col items-center justify-end">
                      <span className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-foreground text-[10px] font-mono px-1.5 py-0.5 rounded border border-border shadow whitespace-nowrap pointer-events-none z-10">
                        {item.count}
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${barHeight}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`w-full rounded-t-sm transition-colors ${
                          isPeak ? "bg-primary" : "bg-muted hover:bg-muted-foreground/30"
                        }`}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-1.5 truncate w-full text-center">
                      {item.hour.replace(":00", "").replace(" ", "")}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>Morning (06–12)</span>
              <span>Afternoon (12–17)</span>
              <span>Evening (17–22)</span>
            </div>
          </div>

          {/* Day of week */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-xs font-semibold text-foreground mb-3">Weekly Volume by Day</h3>
            <div className="grid grid-cols-7 gap-2">
              {data.dayDistribution.map((d) => (
                <div key={d.day} className="p-2.5 rounded-lg bg-muted/40 border border-border text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">{d.day}</p>
                  <p className="text-base font-bold font-mono text-foreground mt-1">{d.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Roster breakdown */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="size-4 text-primary" />
                Roster Status
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Current subscription states</p>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Active", icon: UserCheck, count: data.activeMembers, sub: "Valid passes", iconClass: "bg-primary/10 text-primary", numClass: "text-primary" },
                { label: "Expired", icon: UserX, count: data.expiredMembers, sub: "Overdue renewal", iconClass: "bg-destructive/10 text-destructive", numClass: "text-destructive" },
                { label: "Frozen", icon: ShieldAlert, count: data.frozenMembers, sub: "On hold", iconClass: "bg-amber-500/10 text-amber-500", numClass: "text-amber-500" },
              ].map(({ label, icon: Icon, count, sub, iconClass, numClass }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center ${iconClass}`}>
                      <Icon className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold font-mono ${numClass}`}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Insight */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs">
              <Award className="size-4" />
              <span>Insight</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your peak hour is <strong className="text-foreground">{data.peakHourLabel}</strong>. Consider
              extra staffing or a second kiosk terminal during this window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
