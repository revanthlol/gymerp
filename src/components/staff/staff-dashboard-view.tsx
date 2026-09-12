"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  QrCode,
  CheckCircle2,
  Clock,
  Search,
  LogIn,
  LogOut,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Flame,
  Dumbbell,
  Sparkles,
  RefreshCw,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { staffManualCheckInAction } from "@/lib/api/attendance";
import { toast } from "sonner";

export interface StaffMemberItem {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  status: string;
  joinDate: string | Date;
  qrToken: string;
}

export interface StaffAttendanceItem {
  id: string;
  memberId: string;
  checkedInAt: string | Date;
  method: string;
  kioskId: string | null;
}

interface StaffDashboardViewProps {
  gymName: string;
  initialMembers: StaffMemberItem[];
  todayAttendance: StaffAttendanceItem[];
}

export function StaffDashboardView({
  gymName,
  initialMembers,
  todayAttendance,
}: StaffDashboardViewProps) {
  const [members, setMembers] = useState<StaffMemberItem[]>(initialMembers);
  const [attendanceList, setAttendanceList] = useState<StaffAttendanceItem[]>(todayAttendance);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"floor" | "log">("floor");

  // Compute Active Floor Roster (members who checked in today without an exit check afterwards)
  const floorMembers = useMemo(() => {
    const sorted = [...attendanceList].sort(
      (a, b) => new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime()
    );

    const activeMap = new Map<string, StaffAttendanceItem>();

    for (const log of sorted) {
      if (log.method.includes("exit")) {
        activeMap.delete(log.memberId);
      } else {
        activeMap.set(log.memberId, log);
      }
    }

    return Array.from(activeMap.values()).map((log) => {
      const member = members.find((m) => m.id === log.memberId);
      return {
        logId: log.id,
        memberId: log.memberId,
        member,
        entryTime: new Date(log.checkedInAt),
        method: log.method,
      };
    });
  }, [attendanceList, members]);

  // Search filtered members for quick front-desk lookup
  const searchedMembers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return members
      .filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.phone.replace(/\D/g, "").includes(q) ||
          (m.email && m.email.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [searchQuery, members]);

  const handleManualAction = async (memberId: string, mode: "entry" | "exit") => {
    setActionLoading(memberId);
    try {
      const res: any = await staffManualCheckInAction(memberId, mode);
      if (res.success) {
        toast.success(res.message);
        const newRecord: StaffAttendanceItem = {
          id: String(Date.now()),
          memberId,
          checkedInAt: res.checkedInAt || new Date().toISOString(),
          method: mode === "exit" ? "staff_manual_exit" : "staff_manual_entry",
          kioskId: "front-desk",
        };
        setAttendanceList((prev) => [newRecord, ...prev]);
        setSearchQuery("");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to record front-desk action");
    } finally {
      setActionLoading(null);
    }
  };

  const calculateElapsedMinutes = (entryDate: Date) => {
    const diffMs = Date.now() - entryDate.getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Front Desk & Floor Operations</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time facility arrivals, active gym floor headcount, and manual check-in overrides for {gymName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/staff/kiosk?mode=auto" target="_blank">
            <Button
              size="sm"
              className="bg-primary hover:bg-primary-deep text-[#08090a] font-semibold text-xs h-9 px-3.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(62,207,142,0.25)]"
            >
              <QrCode className="w-4 h-4" />
              <span>Launch Live Kiosk</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Currently on Floor */}
        <div className="glass-panel p-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>ACTIVE FLOOR HEADCOUNT</span>
            <Flame className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {floorMembers.length}
            </span>
            <span className="text-xs text-zinc-400">athletes inside</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Real-time occupancy tracking via front-desk check-in stations
          </p>
        </div>

        {/* Metric 2: Today's Ingress */}
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>TODAY&apos;S TOTAL CHECK-INS</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {attendanceList.length}
            </span>
            <span className="text-xs text-zinc-400">scans logged</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Across self-serve kiosks & desk overrides
          </p>
        </div>

        {/* Metric 3: Active Gym Members */}
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>ELIGIBLE ATHLETES</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {members.filter((m) => m.status === "active").length}
            </span>
            <span className="text-xs text-zinc-400">of {members.length} registered</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Active digital check-in passes
          </p>
        </div>
      </div>

      {/* Quick Kiosk Launchers */}
      <div className="p-4 rounded-2xl bg-[#0c0d10] border border-white/[0.07] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <QrCode className="w-4 h-4 text-primary" />
            <span>Kiosk Terminal Modes</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Open dedicated physical tablet displays for gym entrance and exit lanes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/staff/kiosk?mode=entry" target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 bg-[#14161b] border-white/[0.08] text-primary hover:text-white hover:bg-primary/20 rounded-lg gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entry Lane Kiosk</span>
            </Button>
          </Link>
          <Link href="/staff/kiosk?mode=exit" target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 bg-[#14161b] border-white/[0.08] text-amber-400 hover:text-white hover:bg-amber-500/20 rounded-lg gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Lane Kiosk</span>
            </Button>
          </Link>
          <Link href="/staff/kiosk?mode=auto" target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 bg-[#14161b] border-white/[0.08] text-cyan-400 hover:text-white hover:bg-cyan-500/20 rounded-lg gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Auto Kiosk</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Member Lookup & Manual Check-In Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              <span>Instant Desk Lookup & Override</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Type athlete name, phone number, or pass ID for manual check-in or status checks.
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by athlete name or phone (e.g. 555-0199 or Alex)..."
            className="pl-10 bg-[#08090a] border-white/[0.08] text-xs h-10 rounded-xl text-zinc-100 focus:border-primary"
          />
        </div>

        {/* Searched Results List */}
        {searchQuery.trim() && (
          <div className="rounded-xl border border-white/[0.07] bg-[#08090a] divide-y divide-white/[0.05] overflow-hidden">
            {searchedMembers.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500">
                No athletes found matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              searchedMembers.map((m) => {
                const isOnFloor = floorMembers.some((fm) => fm.memberId === m.id);
                return (
                  <div
                    key={m.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#14161b] border border-white/[0.08] flex items-center justify-center font-bold text-xs text-zinc-200 shrink-0">
                        {m.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{m.fullName}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium capitalize border ${
                              m.status === "active"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                          >
                            {m.status}
                          </span>
                          {isOnFloor && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              On Floor
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono mt-0.5">
                          <span>{m.phone}</span>
                          <span>•</span>
                          <span>Pass #{m.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={actionLoading === m.id}
                        onClick={() => handleManualAction(m.id, "entry")}
                        className="h-8 bg-primary hover:bg-primary-deep text-[#08090a] font-semibold text-xs rounded-lg flex items-center gap-1.5"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Check In</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading === m.id}
                        onClick={() => handleManualAction(m.id, "exit")}
                        className="h-8 border-white/[0.08] text-xs text-zinc-300 hover:text-white hover:bg-white/[0.05] rounded-lg flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Check Out</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Main Floor & Attendance Feed Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("floor")}
              className={`text-sm font-semibold flex items-center gap-2 transition-colors pb-1 border-b-2 ${
                activeTab === "floor"
                  ? "border-primary text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Flame className="w-4 h-4 text-primary" />
              <span>Active Floor Roster</span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                {floorMembers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("log")}
              className={`text-sm font-semibold flex items-center gap-2 transition-colors pb-1 border-b-2 ${
                activeTab === "log"
                  ? "border-primary text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Clock className="w-4 h-4 text-zinc-400" />
              <span>Today&apos;s Gate Log</span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.04] text-zinc-400 border border-white/[0.08]">
                {attendanceList.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab 1: Active Floor Roster */}
        {activeTab === "floor" && (
          <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden">
            {floorMembers.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Users className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-300">Gym Floor is Currently Empty</p>
                <p className="text-xs text-zinc-500">
                  Athletes checking in at kiosks or front desk will populate here with workout durations.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {floorMembers.map((fm) => (
                  <div
                    key={fm.logId}
                    className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {fm.member?.fullName.slice(0, 2).toUpperCase() || "AT"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">
                            {fm.member?.fullName || "Gym Athlete"}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Training Now
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono mt-0.5">
                          <span>Entered {fm.entryTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          <span>•</span>
                          <span>Elapsed: {calculateElapsedMinutes(fm.entryTime)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading === fm.memberId}
                        onClick={() => handleManualAction(fm.memberId, "exit")}
                        className="h-8 border-white/[0.08] text-xs text-amber-400 hover:text-white hover:bg-amber-500/20 rounded-lg gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Exit</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Today's Gate Log */}
        {activeTab === "log" && (
          <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden">
            {attendanceList.length === 0 ? (
              <div className="p-12 text-center text-xs text-zinc-500">
                No member check-ins recorded yet today.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {attendanceList.map((log) => {
                  const member = members.find((m) => m.id === log.memberId);
                  const isExit = log.method.includes("exit");
                  return (
                    <div
                      key={log.id}
                      className="p-4 px-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isExit
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          }`}
                        >
                          {isExit ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">
                            {member?.fullName || "Member"}
                          </p>
                          <p className="text-xs text-zinc-500 font-mono">
                            Pass #{log.memberId.slice(0, 8)} • {log.method}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs text-zinc-400">
                        <p>
                          {new Date(log.checkedInAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                        <span
                          className={`text-[10px] uppercase font-semibold ${
                            isExit ? "text-amber-400" : "text-primary"
                          }`}
                        >
                          {isExit ? "Check-Out" : "Check-In"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
