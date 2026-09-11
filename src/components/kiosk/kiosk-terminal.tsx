"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getRotatingQrAction, staffManualCheckInAction } from "@/lib/api/attendance";
import { playSuccessChime, playDeniedBuzz, playDuplicateNotice } from "@/lib/kiosk/audio";
import {
  enqueueOfflineCheckIn,
  getPendingQueueCount,
  flushKioskQueue,
} from "@/lib/kiosk/offline-queue";
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
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOffline, setPendingOffline] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize network status & pending offline count
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    getPendingQueueCount().then(setPendingOffline);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Wi-Fi reconnected. Syncing offline check-in queue...");
      handleSyncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Wi-Fi disconnected. Kiosk operating in offline queue mode.");
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

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

  const handleToggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => null);
    } else {
      document.exitFullscreen().catch(() => null);
    }
  };

  const handleSyncQueue = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const result = await flushKioskQueue(async (item) => {
        const res = await staffManualCheckInAction(item.memberId);
        return { success: res.success };
      });

      const updatedCount = await getPendingQueueCount();
      setPendingOffline(updatedCount);

      if (result.synced > 0) {
        toast.success(`Successfully synced ${result.synced} offline check-in(s) to cloud!`);
      }
    } catch {
      toast.error("Error synchronizing offline queue.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefreshQr = async (silent = false) => {
    if (!isOnline) {
      if (!silent) toast.info("Offline mode: QR code remains active locally.");
      return;
    }

    setRefreshing(true);
    try {
      const refreshed = await getRotatingQrAction();
      setQrData(refreshed);
      setRemainingSecs(refreshed.remainingSeconds);
      if (!silent) {
        toast.success("Check-In QR pass updated to new unique code");
      }
    } catch {
      if (!silent) toast.error("Failed to rotate QR token");
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualCheckIn = async (member: MemberItem) => {
    setCheckingInId(member.id);

    // If offline, store directly into IndexedDB queue with instant chime
    if (!isOnline) {
      try {
        await enqueueOfflineCheckIn({
          memberId: member.id,
          memberName: member.fullName,
          method: "manual",
          timestamp: new Date().toISOString(),
        });
        const count = await getPendingQueueCount();
        setPendingOffline(count);
        playSuccessChime();
        toast.info(`Offline check-in saved locally for ${member.fullName}`);

        setAttendanceFeed((prev) => [
          {
            id: `offline-${Date.now()}`,
            memberId: member.id,
            checkedInAt: new Date().toISOString(),
            method: "manual (offline)",
            verifiedBy: "Local Kiosk Queue",
          },
          ...prev.slice(0, 7),
        ]);
        setSearchMember("");
        handleRefreshQr(true);
      } catch {
        playDeniedBuzz();
        toast.error("Could not save to local offline storage.");
      } finally {
        setCheckingInId(null);
      }
      return;
    }

    // Online check-in via server action
    try {
      const res = await staffManualCheckInAction(member.id);
      if (res.success) {
        playSuccessChime();
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
        // Automatically roll over to the next fresh unique QR code per scan!
        handleRefreshQr(true);
      } else {
        if ((res as any).duplicate) {
          playDuplicateNotice();
        } else {
          playDeniedBuzz();
        }
        toast.error(res.message);
      }
    } catch {
      // Network drop during request: fallback to offline queue
      await enqueueOfflineCheckIn({
        memberId: member.id,
        memberName: member.fullName,
        method: "manual",
        timestamp: new Date().toISOString(),
      }).catch(() => null);
      playSuccessChime();
      const count = await getPendingQueueCount();
      setPendingOffline(count);
      toast.warning(`Network dropout: Queued ${member.fullName} offline.`);
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
      {/* Page Title & Status Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gym Check-In Kiosk</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Member entrance kiosk with auto-refreshing QR pass and front-desk check-in
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Back to Dashboard button */}
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1 rounded-sm border border-white/[0.08] bg-white/[0.04] text-xs text-zinc-300 hover:text-white hover:border-white/[0.15] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          {/* Network Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono ${
              isOnline
                ? "bg-primary/10 border-primary/25 text-primary"
                : "bg-amber-950/40 border-amber-800/50 text-amber-400 animate-pulse"
            }`}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <Wifi className="w-3 h-3" />
                <span>Online</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <WifiOff className="w-3 h-3" />
                <span>Offline Queue</span>
              </>
            )}
          </div>

          {/* Pending Offline Queue Sync */}
          {pendingOffline > 0 && (
            <button
              type="button"
              onClick={handleSyncQueue}
              disabled={isSyncing || !isOnline}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono hover:bg-amber-500/20 transition-all disabled:opacity-50"
              title="Click to flush offline check-ins to cloud"
            >
              <UploadCloud className={`w-3 h-3 ${isSyncing ? "animate-bounce" : ""}`} />
              <span>{pendingOffline} Queued</span>
              {isOnline && <span className="underline ml-0.5">Sync</span>}
            </button>
          )}

          {/* Fullscreen Toggle for Kiosk Tablets */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleFullscreen}
            className="h-7 px-2.5 text-xs bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:text-white rounded-sm flex items-center gap-1.5"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Kiosk Mode"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Exit</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Fullscreen</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dynamic Single-Use QR Terminal (Takes 7 cols) */}
        <div className="lg:col-span-7 glass-panel p-8 rounded-lg text-center space-y-6 flex flex-col items-center justify-between border-white/[0.08] relative overflow-hidden">
          <div className="space-y-1 text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Per-Scan Dynamic Nonce</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight supa-heading-lg">Member Check-In Pass</h2>
            <p className="text-xs text-zinc-400">
              Unique single-use code — auto-refreshes immediately after each scan
            </p>
          </div>

          {/* Ambient Gaussian Blur Glow Behind QR Terminal */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-primary/15 via-primary-deep/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

          {/* High-Resolution QR Display with Framer Motion Transitions & Scanner Beam */}
          <div className="relative p-5 rounded-lg bg-[#141414] border border-white/[0.09] shadow-2xl flex items-center justify-center overflow-hidden glass-glow-brand">
            {/* Green Laser Scan Sweep Line */}
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_#3ecf8e] pointer-events-none z-20"
              animate={{ top: ["5%", "95%", "5%"] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={qrData.tokenString}
                initial={{ scale: 0.85, opacity: 0, rotateY: 90 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                exit={{ scale: 0.85, opacity: 0, rotateY: -90 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                className="p-3 bg-white rounded-md shadow-2xl flex items-center justify-center"
              >
                <img
                  src={qrData.qrDataUrl}
                  alt="Single-Use Dynamic Check-In QR"
                  className="w-60 h-60 sm:w-68 sm:h-68 object-contain select-none"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Rotation Timer & Single-Use Security Notice */}
          <div className="w-full space-y-3 pt-2">
            <div className="flex items-center justify-between px-4 py-2.5 rounded-md bg-[#171717] border border-white/[0.08] text-xs font-mono">
              <div className="flex items-center gap-2 text-zinc-400">
                <Clock className="w-4 h-4 text-primary" />
                <span>Auto-Refresh In:</span>
              </div>
              <span className="text-primary font-bold text-sm tracking-wider font-mono">
                {formatTimer(remainingSecs)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Single-Use OTP Token (Rotates Per Scan)</span>
              </div>
              <button
                type="button"
                onClick={() => handleRefreshQr(false)}
                disabled={refreshing}
                className="hover:text-zinc-300 flex items-center gap-1 transition-colors"
                title="Generate new unique QR code"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
                <span>New Pass</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Manual Staff Check-In & Live Feed (Takes 5 cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          {/* Manual Member Lookup Section */}
          <div className="glass-panel p-5 rounded-lg space-y-4 border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <UserCheck className="w-4 h-4 text-primary" />
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
                className="pl-9 bg-[#1c1c1c] border-white/[0.08] text-xs h-9 rounded-sm focus:border-primary"
              />
            </div>

            {/* Quick Match Results with Motion */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 pt-1 overflow-hidden"
                >
                  {searchResults.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="p-2.5 rounded-md bg-[#1c1c1c] border border-white/[0.08] flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-medium text-white">{m.fullName}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">{m.phone}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleManualCheckIn(m)}
                        disabled={checkingInId === m.id || m.status !== "active"}
                        className="h-7 text-[11px] px-2.5 bg-primary text-[#171717] font-medium hover:bg-primary-deep rounded-sm"
                      >
                        {checkingInId === m.id ? "Checking In..." : "Check In"}
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Live Recent Check-Ins Feed with Motion */}
          <div className="glass-panel p-5 rounded-lg space-y-3 border-white/[0.08] flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">Live Check-In Feed</span>
              <span className="text-[10px] text-zinc-500 font-mono">Today</span>
            </div>

            {attendanceFeed.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No entries recorded today yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {attendanceFeed.map((att) => (
                    <motion.div
                      key={att.id}
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-2.5 rounded-md bg-[#1c1c1c]/60 border border-white/[0.06] flex items-center justify-between text-xs hover:border-white/[0.12] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
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
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
