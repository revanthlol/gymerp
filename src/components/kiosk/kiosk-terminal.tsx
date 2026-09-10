"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  UserCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getRotatingQrAction, staffManualCheckInAction } from "@/lib/api/attendance";
import { toast } from "sonner";

interface MemberItem {
  id: string;
  fullName: string;
  phone: string;
  status: string;
}

interface AttendanceItem {
  id: string;
  memberId: string;
  checkedInAt: Date | string;
  method: string;
  verifiedBy: string | null;
}

interface KioskTerminalProps {
  initialQr: {
    tokenString: string;
    qrDataUrl: string;
    expiresAt: number;
    remainingSeconds: number;
  };
  members: MemberItem[];
  recentAttendance: AttendanceItem[];
}

export function KioskTerminal({
  initialQr,
  members,
  recentAttendance,
}: KioskTerminalProps) {
  const [qrData, setQrData] = useState(initialQr);
  const [remainingSecs, setRemainingSecs] = useState(initialQr.remainingSeconds);
  const [refreshing, setRefreshing] = useState(false);
  const [searchMember, setSearchMember] = useState("");
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [attendanceFeed, setAttendanceFeed] = useState(recentAttendance);

  // Live countdown timer for 2-hour dynamic rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSecs((prev) => {
        if (prev <= 1) {
          // Trigger automatic refresh of rotating QR code
          handleRefreshQr();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefreshQr = async () => {
    setRefreshing(true);
    try {
      const refreshed = await getRotatingQrAction();
      setQrData(refreshed);
      setRemainingSecs(refreshed.remainingSeconds);
      toast.success("Turnstile QR token rotated to next 2-hour security window");
    } catch {
      toast.error("Failed to rotate QR token");
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualCheckIn = async (member: MemberItem) => {
    setCheckingInId(member.id);
    try {
      const res = await staffManualCheckInAction(member.id);
      if (res.success) {
        toast.success(`Check-in confirmed for ${member.fullName}`);
        setAttendanceFeed((prev) => [
          {
            id: String(Date.now()),
            memberId: member.id,
            checkedInAt: new Date().toISOString(),
            method: "manual",
            verifiedBy: "Front Desk Staff",
          },
          ...prev.slice(0, 7),
        ]);
        setSearchMember("");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Manual check-in failed");
    } finally {
      setCheckingInId(null);
    }
  };

  // Format countdown string HH:MM:SS
  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}h ` : ""}${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  };

  // Filter members for fast staff manual search
  const searchResults = searchMember.trim()
    ? members
        .filter(
          (m) =>
            m.fullName.toLowerCase().includes(searchMember.toLowerCase()) ||
            m.phone.includes(searchMember)
        )
        .slice(0, 4)
    : [];

  const getMemberName = (id: string) => {
    const found = members.find((m) => m.id === id);
    return found ? found.fullName : "Gym Athlete";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Title & Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Turnstile Check-In Kiosk</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Entrance terminal with anti-proxy rotating 2-hour QR code and front-desk manual check-in
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
          <span>Anti-Proxy Security Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dynamic 2-Hour Rotating QR Terminal (Takes 7 cols) */}
        <div className="lg:col-span-7 glass-panel p-8 rounded-3xl text-center space-y-6 flex flex-col items-center justify-between border-zinc-800/80">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">Turnstile Access Pass</h1>
            <p className="text-xs text-zinc-400">
              Scan with your GRYM Member App to unlock entrance gates
            </p>
          </div>

          {/* High-Resolution QR Display */}
          <div className="relative p-4 rounded-2xl bg-white shadow-2xl flex items-center justify-center">
            <img
              src={qrData.qrDataUrl}
              alt="Dynamic 2-Hour Turnstile Access QR"
              className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
            />
          </div>

          {/* Rotation Timer & Anti-Proxy Notice */}
          <div className="w-full space-y-3 pt-2">
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-mono">
              <div className="flex items-center gap-2 text-zinc-400">
                <Clock className="w-4 h-4 text-brand" />
                <span>Code Rotates In:</span>
              </div>
              <span className="text-brand font-bold text-sm tracking-wider">
                {formatTimer(remainingSecs)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Anti-Proxy Security: 2-Hour Window</span>
              </div>
              <button
                type="button"
                onClick={handleRefreshQr}
                disabled={refreshing}
                className="hover:text-zinc-300 flex items-center gap-1 transition-colors"
                title="Force token rotation"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Manual Staff Check-In & Live Feed (Takes 5 cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          {/* Manual Member Lookup Section */}
          <div className="glass-panel p-5 rounded-2xl space-y-4 border-zinc-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <UserCheck className="w-4 h-4 text-brand" />
                <span>Manual Staff Check-In</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Phone / Name</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <Input
                placeholder="Search athlete by name or phone..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="pl-9 bg-zinc-900/80 border-zinc-800 text-xs h-9 rounded-xl focus:border-brand"
              />
            </div>

            {/* Quick Match Results */}
            {searchResults.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {searchResults.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-medium text-white">{m.fullName}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">{m.phone}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleManualCheckIn(m)}
                      disabled={checkingInId === m.id || m.status !== "active"}
                      className="h-7 text-[11px] px-2.5 bg-brand text-carbon-950 font-bold hover:bg-brand/90 rounded-lg"
                    >
                      {checkingInId === m.id ? "Checking In..." : "Check In"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Recent Check-Ins Feed */}
          <div className="glass-panel p-5 rounded-2xl space-y-3 border-zinc-800/80 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">Live Turnstile Activity</span>
              <span className="text-[10px] text-zinc-500 font-mono">Today</span>
            </div>

            {attendanceFeed.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No entries recorded today yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {attendanceFeed.map((att) => (
                  <div
                    key={att.id}
                    className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="font-medium text-zinc-200">{getMemberName(att.memberId)}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {new Date(att.checkedInAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                      {att.method === "qr_scan" ? "QR Scan" : "Desk"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
