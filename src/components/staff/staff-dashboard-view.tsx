"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
  Flame,
  Sparkles,
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

  // Compute Active on Floor (members who checked in today without an exit check afterwards)
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
    <div className="space-y-8 pb-12 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Front Desk & Floor Operations
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time facility arrivals, active gym floor headcount, and manual check-in overrides for {gymName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/staff/kiosk?mode=auto" target="_blank">
            <Button size="sm" className="font-semibold text-xs h-9 gap-1.5">
              <QrCode className="size-4" />
              <span>Launch Live Kiosk</span>
              <ExternalLink className="size-3.5 opacity-60" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Currently on Floor */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-2 shadow-none">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>ACTIVE FLOOR HEADCOUNT</span>
            <Flame className="size-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground tracking-tight font-mono">
              {floorMembers.length}
            </span>
            <span className="text-xs text-muted-foreground">athletes inside</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Real-time occupancy tracking via front-desk check-in stations
          </p>
        </div>

        {/* Metric 2: Today's Ingress */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-2 shadow-none">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>TODAY&apos;S TOTAL CHECK-INS</span>
            <Clock className="size-4 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground tracking-tight font-mono">
              {attendanceList.length}
            </span>
            <span className="text-xs text-muted-foreground">scans logged</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Across self-serve kiosks & desk overrides
          </p>
        </div>

        {/* Metric 3: Active Gym Members */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-2 shadow-none">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>ELIGIBLE ATHLETES</span>
            <Users className="size-4 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground tracking-tight font-mono">
              {members.filter((m) => m.status === "active").length}
            </span>
            <span className="text-xs text-muted-foreground">of {members.length} registered</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Active digital check-in passes
          </p>
        </div>
      </div>

      {/* Quick Kiosk Launchers */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <QrCode className="size-4 text-primary" />
            <span>Kiosk Terminal Modes</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Open dedicated physical tablet displays for gym entrance and exit lanes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/staff/kiosk?mode=entry" target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 rounded-lg gap-1.5 text-foreground"
            >
              <LogIn className="size-3.5 text-primary" />
              <span>Entry Lane</span>
            </Button>
          </Link>
          <Link href="/staff/kiosk?mode=exit" target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 rounded-lg gap-1.5 text-foreground"
            >
              <LogOut className="size-3.5 text-amber-500" />
              <span>Exit Lane</span>
            </Button>
          </Link>
          <Link href="/staff/kiosk?mode=auto" target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 rounded-lg gap-1.5 text-foreground"
            >
              <Sparkles className="size-3.5 text-primary" />
              <span>Smart Auto</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Member Lookup & Manual Check-In Bar */}
      <div className="p-5 rounded-xl border border-border bg-card space-y-4 shadow-none">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Search className="size-4 text-primary" />
            <span>Instant Desk Lookup & Override</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Search athlete by name, phone number, or pass ID for manual check-in or status checks.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by athlete name or phone..."
            className="pl-10 bg-muted/60 border-border text-xs h-10 rounded-xl text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Searched Results List */}
        {searchQuery.trim() && (
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {searchedMembers.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No athletes found matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              searchedMembers.map((m) => {
                const isOnFloor = floorMembers.some((fm) => fm.memberId === m.id);
                return (
                  <div
                    key={m.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-muted border border-border flex items-center justify-center font-bold text-xs text-foreground shrink-0">
                        {m.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">{m.fullName}</span>
                          <span
                            className={`text-xs font-semibold capitalize ${
                              m.status === "active"
                                ? "text-primary"
                                : "text-destructive"
                            }`}
                          >
                            {m.status}
                          </span>
                          {isOnFloor && (
                            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                              • On Floor
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
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
                        className="h-8 font-semibold text-xs rounded-lg gap-1.5"
                      >
                        <LogIn className="size-3.5" />
                        <span>Check In</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading === m.id}
                        onClick={() => handleManualAction(m.id, "exit")}
                        className="h-8 text-xs rounded-lg gap-1.5"
                      >
                        <LogOut className="size-3.5" />
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
        <div className="flex items-center gap-6 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab("floor")}
            className={`text-sm font-semibold flex items-center gap-2 transition-colors pb-2 border-b-2 cursor-pointer ${
              activeTab === "floor"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flame className="size-4 text-primary" />
            <span>Active on Floor</span>
            <span className="text-xs text-muted-foreground font-normal">
              ({floorMembers.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("log")}
            className={`text-sm font-semibold flex items-center gap-2 transition-colors pb-2 border-b-2 cursor-pointer ${
              activeTab === "log"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="size-4 text-muted-foreground" />
            <span>Today&apos;s Gate Log</span>
            <span className="text-xs text-muted-foreground font-normal">
              ({attendanceList.length})
            </span>
          </button>
        </div>

        {/* Tab 1: Active on Floor */}
        {activeTab === "floor" && (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-none">
            {floorMembers.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Users className="size-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold text-foreground">Gym Floor is Currently Empty</p>
                <p className="text-xs text-muted-foreground">
                  Athletes checking in at kiosks or front desk will populate here with workout durations.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {floorMembers.map((fm) => (
                  <div
                    key={fm.logId}
                    className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {fm.member?.fullName.slice(0, 2).toUpperCase() || "AT"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">
                            {fm.member?.fullName || "Gym Athlete"}
                          </span>
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Training Now
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
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
                        className="h-8 text-xs text-amber-600 dark:text-amber-400 border-amber-400/30 hover:bg-amber-500/10 rounded-lg gap-1.5"
                      >
                        <LogOut className="size-3.5" />
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
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-none">
            {attendanceList.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No member check-ins recorded yet today.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {attendanceList.map((log) => {
                  const member = members.find((m) => m.id === log.memberId);
                  const isExit = log.method.includes("exit");
                  return (
                    <div
                      key={log.id}
                      className="p-4 px-5 flex items-center justify-between hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isExit
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          }`}
                        >
                          {isExit ? <LogOut className="size-4" /> : <LogIn className="size-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {member?.fullName || "Member"}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            Pass #{log.memberId.slice(0, 8)} • {log.method}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs text-muted-foreground">
                        <p className="text-foreground font-medium">
                          {new Date(log.checkedInAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                        <span
                          className={`text-xs font-semibold ${
                            isExit ? "text-amber-600 dark:text-amber-400" : "text-primary"
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
