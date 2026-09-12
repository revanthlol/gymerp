"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
import { RotateCw, UserCheck, Search, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

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

  useEffect(() => {
    setRecords(initialAttendance);
  }, [initialAttendance]);

  // Periodic auto-polling every 8 seconds for live front-desk stream
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
      toast.success("Attendance stream refreshed");
    }, 600);
  };

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Attendance & Check-Ins</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {records.length} today
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time feed of athlete kiosk check-ins, mobile QR scans, and front-desk entries.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:text-white text-xs flex items-center gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </Button>

          <TurnstileQrDialog />

          <div className="text-xs font-mono text-primary bg-primary/10 border border-primary/25 px-2.5 py-1.5 rounded-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Live Stream (8s)</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by athlete name, phone, terminal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0c0d10] border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d10] overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/[0.08] bg-white/[0.02]">
              <TableHead className="text-zinc-400 font-medium text-xs">Athlete</TableHead>
              <TableHead className="text-zinc-400 font-medium text-xs">Scan Method</TableHead>
              <TableHead className="text-zinc-400 font-medium text-xs">Terminal / Kiosk ID</TableHead>
              <TableHead className="text-zinc-400 font-medium text-xs">Timestamp</TableHead>
              <TableHead className="text-right text-zinc-400 font-medium text-xs">Access Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UserCheck className="w-6 h-6 text-zinc-600" />
                    <span>No check-in records matching your query</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => {
                const member = memberMap.get(record.memberId);
                return (
                  <TableRow
                    key={record.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                  >
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs font-mono">
                          {(member?.fullName || "A").charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-100">
                            {member?.fullName || "Athlete Account"}
                          </p>
                          <p className="text-[11px] font-mono text-zinc-500">{member?.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-300">
                      <span className="bg-white/[0.05] px-2 py-0.5 rounded-md border border-white/[0.08] uppercase text-[10px] tracking-wider text-zinc-300">
                        {record.method}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-400">
                      {record.kioskId || "kiosk-tablet"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-400">
                      {new Date(record.checkedInAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}{" "}
                      ·{" "}
                      <span className="text-zinc-600">
                        {new Date(record.checkedInAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="success">Access Granted</Badge>
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
