"use client";

import React, { useState, useMemo } from "react";
import {
  Flame,
  Calendar as CalendarIcon,
  CheckCircle2,
  Search,
  Filter,
  ArrowUpDown,
  Clock,
  ScanLine,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CheckInTrigger } from "@/components/portal/check-in-trigger";

interface AttendanceRecord {
  id: string;
  checkedInAt: Date | string;
  method: string;
  kioskId?: string | null;
}

interface AttendanceViewProps {
  memberUid: string;
  attendanceList: AttendanceRecord[];
  stats: {
    currentStreak: number;
    workoutsThisMonth: number;
    totalWorkouts: number;
  };
}

export function AttendanceView({ memberUid, attendanceList, stats }: AttendanceViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState<"all" | "kiosk_entry" | "kiosk_exit">("all");

  // Build 30-day activity matrix
  const matrixDays = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Set of dates with attendance
    const attendedSet = new Set(
      attendanceList.map((a) => {
        const d = new Date(a.checkedInAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })
    );

    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({
        date: d,
        dateStr,
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString("en-US", { weekday: "narrow" }),
        isAttended: attendedSet.has(dateStr),
        isToday: i === 0,
      });
    }
    return days;
  }, [attendanceList]);

  // Filtered log items
  const filteredList = useMemo(() => {
    return attendanceList.filter((log) => {
      const dStr = new Date(log.checkedInAt).toLocaleDateString().toLowerCase();
      const methodStr = log.method.toLowerCase();
      const matchesSearch = dStr.includes(searchTerm.toLowerCase()) || methodStr.includes(searchTerm.toLowerCase());
      const matchesFilter = methodFilter === "all" ? true : log.method === methodFilter;
      return matchesSearch && matchesFilter;
    });
  }, [attendanceList, searchTerm, methodFilter]);

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Workouts & Attendance Streaks
          </h1>
          <p className="text-xs text-muted-foreground">
            Track your workout frequency, consistency streaks, and turnstile verification logs.
          </p>
        </div>
        <CheckInTrigger memberUid={memberUid} variant="hero" />
      </div>

      {/* Streak Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Consecutive Streak</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground pt-1">
            {stats.currentStreak} {stats.currentStreak === 1 ? "day" : "days"}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.currentStreak >= 3 ? "Super disciplined! Keep it up." : "Work out today to build momentum."}
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Sessions This Month</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground pt-1">
            {stats.workoutsThisMonth} {stats.workoutsThisMonth === 1 ? "workout" : "workouts"}
          </div>
          <p className="text-xs text-muted-foreground">
            {Math.round((stats.workoutsThisMonth / 20) * 100)}% of monthly target (20 days)
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">All-Time Check-Ins</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground pt-1">
            {stats.totalWorkouts} {stats.totalWorkouts === 1 ? "visit" : "visits"}
          </div>
          <p className="text-xs text-muted-foreground">
            Lifetime verified turnstile entries
          </p>
        </div>
      </div>

      {/* 28-Day Consistency Matrix Heatmap */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Last 4 Weeks Consistency Matrix</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Colored indicators show verified gym access sessions
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="w-3 h-3 rounded-md bg-muted border border-border/80" />
            <span>Rest Day</span>
            <span className="w-3 h-3 rounded-md bg-emerald-500" />
            <span>Trained</span>
          </div>
        </div>

        {/* Grid Matrix */}
        <div className="grid grid-cols-7 sm:grid-cols-14 md:grid-cols-28 gap-2 pt-2">
          {matrixDays.map((day) => (
            <div
              key={day.dateStr}
              title={`${day.date.toDateString()}: ${day.isAttended ? "Trained" : "Rest"}`}
              className="flex flex-col items-center gap-1 group"
            >
              <span className="text-[10px] text-muted-foreground font-mono">{day.dayName}</span>
              <div
                className={cn(
                  "w-full aspect-square rounded-xl flex items-center justify-center text-[10px] font-mono font-medium transition-all group-hover:scale-105",
                  day.isAttended
                    ? "bg-emerald-500 text-white font-bold shadow-sm shadow-emerald-500/20"
                    : day.isToday
                    ? "bg-muted border-2 border-dashed border-primary/60 text-foreground font-semibold"
                    : "bg-muted/60 text-muted-foreground border border-border/40"
                )}
              >
                {day.dayNum}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filterable Attendance Log Table */}
      <div className="rounded-2xl bg-card border border-border/80 shadow-sm overflow-hidden space-y-0">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search date or station..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-muted rounded-xl text-xs">
              <button
                onClick={() => setMethodFilter("all")}
                className={cn(
                  "px-3 py-1 rounded-lg font-medium transition-all",
                  methodFilter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              <button
                onClick={() => setMethodFilter("kiosk_entry")}
                className={cn(
                  "px-3 py-1 rounded-lg font-medium transition-all",
                  methodFilter === "kiosk_entry" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Entries
              </button>
              <button
                onClick={() => setMethodFilter("kiosk_exit")}
                className={cn(
                  "px-3 py-1 rounded-lg font-medium transition-all",
                  methodFilter === "kiosk_exit" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Exits
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Date & Day</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Access Type</th>
                <th className="py-3 px-4">Terminal / Station</th>
                <th className="py-3 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-sans">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No matching attendance logs found.
                  </td>
                </tr>
              ) : (
                filteredList.map((log) => {
                  const dateObj = new Date(log.checkedInAt);
                  const isExit = log.method.includes("exit");
                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <div>{dateObj.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
                            isExit
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          )}
                        >
                          {isExit ? "Facility Exit" : "Facility Entry"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                        {log.kioskId || "Turnstile Station"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approved</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
