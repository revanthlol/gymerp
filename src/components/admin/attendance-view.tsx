"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TurnstileQrDialog } from "@/components/admin/turnstile-qr-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  RotateCw,
  UserCheck,
  Search,
  Flame,
  Clock,
  CalendarDays,
  Download,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  ShieldCheck,
  Calendar as CalendarIcon,
  ArrowRight,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { staffManualCheckInAction } from "@/lib/api/attendance";

interface AttendanceRecord {
  id: string;
  memberId: string;
  checkedInAt: Date | string;
  method: string;
  kioskId: string | null;
}

interface MemberRecord {
  id: string;
  fullName: string;
  phone: string;
}

interface AttendanceViewProps {
  initialAttendance: AttendanceRecord[];
  members: MemberRecord[];
}

export function AttendanceView({ initialAttendance, members }: AttendanceViewProps) {
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>(initialAttendance);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"floor" | "log" | "calendar">("floor");
  const [search, setSearch] = useState("");
  const [timeScope, setTimeScope] = useState<"today" | "7d" | "30d" | "all">("today");
  const [methodFilter, setMethodFilter] = useState<"all" | "qr" | "manual">("all");
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Selected day for Calendar drilldown
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  useEffect(() => {
    setRecords(initialAttendance);
  }, [initialAttendance]);

  // Auto-poll every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 8000);
    return () => clearInterval(interval);
  }, [router]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Attendance synced");
    }, 600);
  };

  // 1. Calculate Active on Floor
  const floorMembers = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayLogs = records
      .filter((r) => new Date(r.checkedInAt).toISOString().slice(0, 10) === todayStr)
      .sort((a, b) => new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime());

    const activeMap = new Map<string, { log: AttendanceRecord; member: MemberRecord }>();

    for (const log of todayLogs) {
      const member = memberMap.get(log.memberId);
      if (!member) continue;

      if (log.method.includes("exit")) {
        activeMap.delete(log.memberId);
      } else {
        activeMap.set(log.memberId, { log, member });
      }
    }

    return Array.from(activeMap.values()).reverse();
  }, [records, memberMap]);

  // 2. Handle manual check-out from floor
  const handleCheckOut = async (memberId: string, memberName: string) => {
    setCheckingOutId(memberId);
    try {
      const res = await staffManualCheckInAction(memberId, "exit");
      if (res.success) {
        toast.success(`Check-out confirmed for ${memberName}`);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to check out member");
      }
    } catch (err: any) {
      toast.error(err?.message || "Check-out failed");
    } finally {
      setCheckingOutId(null);
    }
  };

  // Helper to compute minutes elapsed
  const getElapsedString = (checkedInAt: Date | string) => {
    const diffMin = Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 60000);
    if (diffMin < 1) return "Just entered";
    if (diffMin < 60) return `${diffMin}m in facility`;
    const hours = Math.floor(diffMin / 60);
    const rem = diffMin % 60;
    return `${hours}h ${rem}m in facility`;
  };

  // 3. Filtered Records for Log Tab
  const filteredRecords = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    return records.filter((r) => {
      const recordDate = new Date(r.checkedInAt);
      const recordDateStr = recordDate.toISOString().slice(0, 10);

      // Time Scope Filter
      if (timeScope === "today" && recordDateStr !== todayStr) return false;
      if (timeScope === "7d" && recordDate < sevenDaysAgo) return false;
      if (timeScope === "30d" && recordDate < thirtyDaysAgo) return false;

      // Method Filter
      if (methodFilter === "qr" && !r.method.toLowerCase().includes("qr")) return false;
      if (methodFilter === "manual" && !r.method.toLowerCase().includes("manual")) return false;

      // Search
      const member = memberMap.get(r.memberId);
      const q = search.toLowerCase().trim();
      if (q) {
        const matchesName = member?.fullName.toLowerCase().includes(q);
        const matchesPhone = member?.phone.toLowerCase().includes(q);
        const matchesKiosk = r.kioskId?.toLowerCase().includes(q);
        const matchesMethod = r.method.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesKiosk && !matchesMethod) return false;
      }

      return true;
    });
  }, [records, memberMap, timeScope, methodFilter, search]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [timeScope, methodFilter, search]);

  // CSV Export
  const handleExportCsv = () => {
    const headers = ["Member Name", "Phone", "Action", "Method", "Station", "Date", "Time"];
    const rows = filteredRecords.map((r) => {
      const m = memberMap.get(r.memberId);
      const d = new Date(r.checkedInAt);
      return [
        `"${m?.fullName || "Unknown"}"`,
        `"${m?.phone || ""}"`,
        r.method.includes("exit") ? "Exit" : "Entry",
        r.method,
        `"${r.kioskId || "—"}"`,
        d.toLocaleDateString("en-IN"),
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gymerp_attendance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendance CSV exported successfully");
  };

  // 4. Calendar Matrix Data (Last 28 days)
  const calendarDays = useMemo(() => {
    const days: Array<{ dateStr: string; label: string; count: number; dayName: string }> = [];
    const now = new Date();

    for (let i = 27; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLogs = records.filter(
        (r) => new Date(r.checkedInAt).toISOString().slice(0, 10) === dateStr
      );
      days.push({
        dateStr,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        count: dayLogs.length,
      });
    }
    return days;
  }, [records]);

  // Drilldown for selected calendar date
  const selectedDateLogs = useMemo(() => {
    return records
      .filter((r) => new Date(r.checkedInAt).toISOString().slice(0, 10) === selectedCalendarDate)
      .sort((a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime());
  }, [records, selectedCalendarDate]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Attendance & Floor
            </h1>
            <span className="relative flex h-2 w-2 mt-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-muted-foreground font-medium">Live Terminal</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {floorMembers.length} active on floor · {records.length} total logged sessions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="h-9 px-3 gap-1.5 text-xs rounded-xl hover:bg-muted/60 transition-all"
          >
            <RotateCw className={`size-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>Sync</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-9 px-3 gap-1.5 text-xs rounded-xl hover:bg-muted/60 transition-all"
          >
            <Download className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          <TurnstileQrDialog />
        </div>
      </div>

      {/* Primary 3-Mode View Switcher */}
      <div className="flex items-center gap-1 p-1 bg-muted/60 border border-border rounded-xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab("floor")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "floor"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Flame className="size-4 text-primary" />
          <span>Active on Floor</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
            {floorMembers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("log")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "log"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="size-4 text-muted-foreground" />
          <span>Attendance Log</span>
        </button>

        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "calendar"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays className="size-4 text-muted-foreground" />
          <span>Calendar & Trends</span>
        </button>
      </div>

      {/* Tab 1: Live Active on Floor */}
      {activeTab === "floor" && (
        <div className="space-y-6">
          {/* Floor Summary KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Current Floor Occupancy
              </span>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-mono font-bold text-foreground">
                  {floorMembers.length}
                </p>
                <span className="text-xs text-primary font-medium">members inside</span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Real-time active workout sessions
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Today&apos;s Total Volume
              </span>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-mono font-bold text-foreground">
                  {
                    records.filter(
                      (r) =>
                        new Date(r.checkedInAt).toISOString().slice(0, 10) ===
                        new Date().toISOString().slice(0, 10)
                    ).length
                  }
                </p>
                <span className="text-xs text-muted-foreground">turnstile interactions</span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Total check-ins & check-outs today
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Turnstile Status
              </span>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck className="size-5 text-emerald-500" />
                <span className="text-sm font-semibold text-foreground">Autonomous Ready</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                All kiosks synced with central gate
              </p>
            </div>
          </div>

          {/* Floor Members Grid */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Flame className="size-4 text-primary" />
              <span>Athletes Inside Gym ({floorMembers.length})</span>
            </h2>

            {floorMembers.length === 0 ? (
              <div className="p-16 rounded-xl border border-dashed border-border bg-card/40 text-center space-y-2 flex flex-col items-center justify-center">
                <Users className="size-8 text-muted-foreground/40" />
                <p className="text-sm font-semibold text-foreground">Gym Floor is Currently Clear</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  No active workout sessions in progress. Scans at the kiosk or front desk will automatically populate here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {floorMembers.map(({ log, member }) => {
                    const isCheckingOut = checkingOutId === member.id;
                    const initial = (member.fullName || "?").charAt(0).toUpperCase();

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={member.id}
                        className="p-5 rounded-xl border border-border bg-card flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {member.fullName}
                              </h3>
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                {member.phone}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 shrink-0">
                            Active
                          </span>
                        </div>

                        <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                          <div>
                            <p className="font-semibold text-foreground">
                              {new Date(log.checkedInAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p className="text-[11px] text-primary font-medium">
                              {getElapsedString(log.checkedInAt)}
                            </p>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isCheckingOut}
                            onClick={() => handleCheckOut(member.id, member.fullName)}
                            className="h-8 px-3 text-xs gap-1.5 rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                          >
                            {isCheckingOut ? (
                              <Spinner size="sm" variant="current" />
                            ) : (
                              <>
                                <LogOut className="size-3.5" />
                                <span>Check Out</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Attendance History Log */}
      {activeTab === "log" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by member, phone, kiosk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 bg-muted/60 border-border text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Time Scopes */}
              <div className="flex items-center gap-1 p-1 bg-muted/60 border border-border rounded-xl">
                {(["today", "7d", "30d", "all"] as const).map((scope) => (
                  <button
                    key={scope}
                    onClick={() => setTimeScope(scope)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                      timeScope === scope
                        ? "bg-card text-foreground shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {scope === "today"
                      ? "Today"
                      : scope === "7d"
                      ? "7 Days"
                      : scope === "30d"
                      ? "30 Days"
                      : "All"}
                  </button>
                ))}
              </div>

              {/* Method Filter */}
              <div className="flex items-center gap-1 p-1 bg-muted/60 border border-border rounded-xl">
                {(["all", "qr", "manual"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethodFilter(m)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                      methodFilter === m
                        ? "bg-card text-foreground shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "all" ? "All Methods" : m === "qr" ? "QR Kiosk" : "Front Desk"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Log Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs font-medium text-muted-foreground">Athlete</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Type</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Method / Gate</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Kiosk Station</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Timestamp</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <UserCheck className="size-6 text-muted-foreground/40" />
                          <p className="text-sm font-semibold text-foreground">No attendance records found</p>
                          <p className="text-xs text-muted-foreground">Try broadening your search query or date scope.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRecords.map((record) => {
                      const member = memberMap.get(record.memberId);
                      const initial = (member?.fullName || "?").charAt(0).toUpperCase();
                      const isExit = record.method.toLowerCase().includes("exit");

                      return (
                        <TableRow
                          key={record.id}
                          className="border-b border-border hover:bg-muted/40 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                                {initial}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-foreground">{member?.fullName || "Unknown"}</p>
                                <p className="text-[11px] text-muted-foreground font-mono">{member?.phone || "—"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                isExit
                                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              }`}
                            >
                              {isExit ? "Check-Out" : "Check-In"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground capitalize">
                              {record.method.replace("kiosk_", "").replace("_", " ")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground font-mono">
                              {record.kioskId || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-xs font-medium text-foreground">
                                {new Date(record.checkedInAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {new Date(record.checkedInAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs font-semibold text-primary">Granted</span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {filteredRecords.length > 0 && (
              <div className="px-4 py-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-semibold text-foreground">
                    {Math.min(currentPage * pageSize, filteredRecords.length)}
                  </span> of <span className="font-semibold text-foreground">{filteredRecords.length}</span> logs
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-1">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-2.5 text-xs gap-1 rounded-lg"
                  >
                    <ChevronLeft className="size-3.5" />
                    <span>Prev</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 px-2.5 text-xs gap-1 rounded-lg"
                  >
                    <span>Next</span>
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Calendar & Trends */}
      {activeTab === "calendar" && (
        <div className="space-y-6">
          {/* Calendar Heatmap Matrix */}
          <div className="p-6 rounded-xl border border-border bg-card space-y-4 shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CalendarDays className="size-4 text-primary" />
                  <span>28-Day Attendance Heatmap</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click on any day to drill down into its full attendee list
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-2 rounded-full bg-muted" />
                <span>0 scans</span>
                <span className="size-2 rounded-full bg-primary/30" />
                <span>1–5</span>
                <span className="size-2 rounded-full bg-primary/70" />
                <span>6–15</span>
                <span className="size-2 rounded-full bg-primary" />
                <span>16+</span>
              </div>
            </div>

            {/* Grid of 28 Days */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-2">
              {calendarDays.map((day) => {
                const isSelected = selectedCalendarDate === day.dateStr;
                let bgIntensity = "bg-muted/40 border-border text-muted-foreground";
                if (day.count > 15) bgIntensity = "bg-primary text-primary-foreground border-primary";
                else if (day.count > 5) bgIntensity = "bg-primary/20 text-foreground border-primary/40";
                else if (day.count > 0) bgIntensity = "bg-primary/10 text-foreground border-primary/20";

                return (
                  <button
                    key={day.dateStr}
                    onClick={() => setSelectedCalendarDate(day.dateStr)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "hover:scale-[1.02]"
                    } ${bgIntensity}`}
                  >
                    <span className="text-[10px] uppercase font-semibold tracking-wider opacity-80">
                      {day.dayName}
                    </span>
                    <span className="text-sm font-bold font-mono">
                      {day.count}
                    </span>
                    <span className="text-[9px] opacity-70">
                      {day.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drilldown for Selected Date */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-none">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  <span>
                    Day Breakdown: {new Date(selectedCalendarDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedDateLogs.length} total turnstile actions recorded
                </p>
              </div>
            </div>

            {selectedDateLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No check-in or check-out activity recorded on this day.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {selectedDateLogs.map((log) => {
                  const m = memberMap.get(log.memberId);
                  const isExit = log.method.toLowerCase().includes("exit");
                  return (
                    <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
                          {(m?.fullName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{m?.fullName || "Unknown Member"}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{m?.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isExit
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {isExit ? "Check-Out" : "Check-In"}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {new Date(log.checkedInAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
