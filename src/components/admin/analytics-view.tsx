"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Clock,
  Calendar,
  Wallet,
  Activity,
  BarChart3,
  Award,
  ArrowUpRight,
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Gym Analytics & Insights
            </h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Peak facility attendance hours, membership retention health, and revenue velocities.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          {(["7d", "30d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                timeRange === r
                  ? "bg-zinc-800 text-brand font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {r === "7d" ? "Past 7 Days" : r === "30d" ? "Past 30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Retention Rate */}
        <div className="glass-card p-5 rounded-lg border border-white/[0.08] bg-[#1c1c1c]/90 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Retention Health
            </span>
            <div className="w-7 h-7 rounded-sm bg-primary/10 text-primary flex items-center justify-center font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-3xl font-mono font-extrabold text-white mt-3">
            {data.retentionRate}%
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            <span className="text-primary font-semibold">{data.activeMembers}</span> active of{" "}
            {data.totalMembers} athletes
          </p>
        </div>

        {/* Peak Facility Traffic */}
        <div className="glass-card p-5 rounded-lg border border-white/[0.08] bg-[#1c1c1c]/90 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Peak Traffic Hour
            </span>
            <div className="w-7 h-7 rounded-sm bg-primary/10 text-primary flex items-center justify-center font-mono">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-3xl font-mono font-extrabold text-primary mt-3">
            {data.peakHourLabel}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Highest attendance rush window
          </p>
        </div>

        {/* Total Check-Ins */}
        <div className="glass-card p-5 rounded-lg border border-white/[0.08] bg-[#1c1c1c]/90 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Total Check-Ins
            </span>
            <div className="w-7 h-7 rounded-sm bg-white/[0.05] text-zinc-300 flex items-center justify-center font-mono">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-3xl font-mono font-extrabold text-white mt-3">
            {data.totalCheckIns}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            ~{data.avgVisitsPerMember} visits per active member
          </p>
        </div>

        {/* Revenue Velocity */}
        <div className="glass-card p-5 rounded-lg border border-white/[0.08] bg-[#1c1c1c]/90 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-7 h-7 rounded-sm bg-white/[0.05] text-zinc-300 flex items-center justify-center font-mono">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-3xl font-mono font-extrabold text-zinc-200 mt-3">
            {formatCurrency(data.totalRevenue)}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            {formatCurrency(data.onlineRevenue)} online · {formatCurrency(data.manualRevenue)} cash
          </p>
        </div>
      </div>

      {/* Main Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Peak Hours Heatmap / Bar Chart (8 cols) */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-lg border border-white/[0.08] space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span>Daily Hourly Attendance Traffic (6 AM — 10 PM)</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Distribution of gym check-ins across operating hours
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-500">Live Kiosk Telemetry</span>
          </div>

          {/* Hourly Histogram Bars */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 items-end h-44 pb-2 border-b border-white/[0.08]">
              {data.hourlyDistribution.map((item) => {
                const isPeak = item.hour === data.peakHourLabel;
                const barHeight = Math.max(8, item.percentage);

                return (
                  <div key={item.hour} className="flex flex-col items-center h-full justify-end group">
                    <div className="relative w-full flex flex-col items-center justify-end">
                      {/* Tooltip on hover */}
                      <span className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[#242424] text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none border border-white/[0.08]">
                        {item.count} scans
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${barHeight}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`w-full rounded-t-sm transition-all ${
                          isPeak
                            ? "bg-primary shadow-[0_0_12px_rgba(62,207,142,0.6)]"
                            : "bg-zinc-800 hover:bg-zinc-700"
                        }`}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 mt-2 truncate w-full text-center">
                      {item.hour.replace(":00", "").replace(" ", "")}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1">
              <span>Morning Shift (06:00 - 12:00)</span>
              <span>Afternoon (12:00 - 17:00)</span>
              <span>Evening Rush (17:00 - 22:00)</span>
            </div>
          </div>

          {/* Attendance Days of Week */}
          <div className="pt-4 border-t border-zinc-800/80">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
              Weekly Volume by Day
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {data.dayDistribution.map((d) => (
                <div
                  key={d.day}
                  className="p-2.5 rounded-sm bg-[#171717] border border-white/[0.08] text-center"
                >
                  <p className="text-[10px] font-mono text-zinc-500 uppercase">{d.day}</p>
                  <p className="text-base font-mono font-bold text-white mt-1">{d.count}</p>
                  <p className="text-[9px] text-zinc-400">check-ins</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Member Health & Churn Breakdown (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-6 rounded-lg border border-white/[0.08] space-y-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Roster Breakdown</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Current member subscription states
              </p>
            </div>

            <div className="space-y-3">
              {/* Active */}
              <div className="p-3.5 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-sm bg-primary/20 text-primary flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Active Members</p>
                    <p className="text-[10px] text-zinc-400">Valid passes & renewals</p>
                  </div>
                </div>
                <span className="text-lg font-mono font-extrabold text-primary">
                  {data.activeMembers}
                </span>
              </div>

              {/* Expired */}
              <div className="p-3.5 rounded-md bg-red-950/20 border border-red-800/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-sm bg-red-500/20 text-red-400 flex items-center justify-center">
                    <UserX className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Expired Passes</p>
                    <p className="text-[10px] text-zinc-400">Overdue for renewal</p>
                  </div>
                </div>
                <span className="text-lg font-mono font-extrabold text-red-400">
                  {data.expiredMembers}
                </span>
              </div>

              {/* Frozen */}
              <div className="p-3.5 rounded-md bg-amber-950/20 border border-amber-800/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-sm bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Frozen / On-Hold</p>
                    <p className="text-[10px] text-zinc-400">Temporary pauses</p>
                  </div>
                </div>
                <span className="text-lg font-mono font-extrabold text-amber-400">
                  {data.frozenMembers}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Insights Banner */}
          <div className="glass-panel p-5 rounded-lg border border-white/[0.08] bg-gradient-to-br from-primary/5 to-transparent space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs">
              <Award className="w-4 h-4" />
              <span>Smart Recommendation</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Your evening rush peaks at <strong className="text-white">{data.peakHourLabel}</strong>. Consider assigning an extra front-desk staff member or adding a second kiosk terminal during this window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
