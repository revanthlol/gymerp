"use client";

import React, { useState, useEffect } from "react";
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
import { RotateCw, UserCheck, Search } from "lucide-react";
import { toast } from "sonner";

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
  const [search, setSearch] = useState("");

  const memberMap = new Map(members.map((m) => [m.id, m]));

  useEffect(() => { setRecords(initialAttendance); }, [initialAttendance]);

  // Auto-poll every 8s
  useEffect(() => {
    const interval = setInterval(() => { router.refresh(); }, 8000);
    return () => clearInterval(interval);
  }, [router]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Refreshed");
    }, 600);
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = records.filter(
    (r) => new Date(r.checkedInAt).toISOString().slice(0, 10) === todayStr
  ).length;

  const filteredRecords = records.filter((r) => {
    const member = memberMap.get(r.memberId);
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      member?.fullName.toLowerCase().includes(q) ||
      member?.phone.toLowerCase().includes(q) ||
      r.method.toLowerCase().includes(q) ||
      (r.kioskId && r.kioskId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Attendance</h1>
            {/* Live amber dot */}
            <span className="relative flex h-2 w-2 mt-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-xs text-muted-foreground font-medium">Live</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {todayCount} check-in{todayCount !== 1 ? "s" : ""} today · {records.length} total records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="h-8 gap-1.5 text-xs"
          >
            <RotateCw className={`size-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>
          <TurnstileQrDialog />
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search member, method, kiosk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full pl-9 pr-3 text-xs rounded-lg bg-muted/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-medium text-muted-foreground">Member</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Method</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Kiosk / Terminal</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Time</TableHead>
              <TableHead className="text-right text-xs font-medium text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <UserCheck className="size-6 text-muted-foreground/40" />
                    <span className="text-sm text-muted-foreground">No check-in records</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => {
                const member = memberMap.get(record.memberId);
                const initial = (member?.fullName || "?").charAt(0).toUpperCase();
                return (
                  <TableRow
                    key={record.id}
                    className="border-b border-border hover:bg-muted/40 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                          {initial}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{member?.fullName || "Unknown"}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{member?.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground capitalize">{record.method}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-mono">{record.kioskId || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {new Date(record.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(record.checkedInAt).toLocaleDateString("en-IN")}
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
    </div>
  );
}
