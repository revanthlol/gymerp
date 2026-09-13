"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Smartphone,
  Sparkles,
  ShieldCheck,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getRotatingQrAction,
  kioskPassOrPhoneCheckInAction,
  staffManualCheckInAction,
} from "@/lib/api/attendance";
import { UniqueQrData } from "@/lib/attendance/qr";
import {
  playSuccessChime,
  playDeniedBuzz,
} from "@/lib/kiosk/audio";
import {
  getPendingQueueCount,
  flushKioskQueue,
} from "@/lib/kiosk/offline-queue";
import { KioskQrDisplay } from "@/components/kiosk/kiosk-qr-display";
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
  initialQr: UniqueQrData;
  members: MemberItem[];
  recentAttendance: AttendanceItem[];
}

export function KioskTerminal({
  initialQr,
  members,
  recentAttendance,
}: KioskTerminalProps) {
  const [qrData, setQrData] = useState(initialQr);
  const [remainingSecs, setRemainingSecs] = useState(initialQr.remainingSeconds || 20);
  const [refreshing, setRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Recent attendance feed & flash banner
  const [attendanceFeed, setAttendanceFeed] = useState(recentAttendance);
  const [lastScannedMember, setLastScannedMember] = useState<{
    name: string;
    mode: "entry" | "exit";
    time: string;
  } | null>(null);

  // Manual PIN / Phone Check-In Modal for dead phone battery
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const [keypadResult, setKeypadResult] = useState<{
    success: boolean;
    expired?: boolean;
    message: string;
    mode?: "entry" | "exit";
    member?: {
      id: string;
      fullName: string;
      phone: string;
      joinDate: string;
      expiryDate: string;
      status: "active" | "expired" | "frozen";
    };
  } | null>(null);

  // Network & offline queue state
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOffline, setPendingOffline] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize network & fullscreen listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    getPendingQueueCount().then(setPendingOffline);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Wi-Fi connected. Syncing kiosk queue...");
      handleSyncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Operating in offline queue mode.");
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
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

  // Anti-proxy live countdown timer: rotates every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSecs((prev) => {
        if (prev <= 1) {
          handleRefreshQr(true);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefreshQr = async (silent = false) => {
    if (!isOnline) {
      if (!silent) toast.info("Offline mode: Local QR remaining active.");
      return;
    }

    setRefreshing(true);
    try {
      const refreshed = await getRotatingQrAction("auto");
      setQrData(refreshed);
      setRemainingSecs(refreshed.remainingSeconds || 20);
      if (!silent) {
        toast.success("Kiosk QR code rotated");
      }
    } catch {
      if (!silent) toast.error("Could not rotate QR code");
    } finally {
      setRefreshing(false);
    }
  };

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
        const res = await staffManualCheckInAction(item.memberId, "auto");
        return { success: res.success };
      });

      const updatedCount = await getPendingQueueCount();
      setPendingOffline(updatedCount);

      if (result.synced > 0) {
        toast.success(`Synced ${result.synced} offline check-ins to database`);
      }
    } catch {
      toast.error("Offline sync encountered an error");
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual Phone/PIN Check-In submission (for dead phone battery)
  const handlePhoneCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;

    setPhoneSubmitting(true);
    setKeypadResult(null);

    try {
      const res: any = await kioskPassOrPhoneCheckInAction({
        identifier: phoneInput.trim(),
        mode: "auto",
      });

      setKeypadResult(res);

      if (res.success) {
        if (soundEnabled) playSuccessChime();
        toast.success(res.message);

        const finalMode = res.mode === "exit" ? "exit" : "entry";
        setLastScannedMember({
          name: res.member?.fullName || "Athlete",
          mode: finalMode,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });

        // Flash banner auto-dismisses after 4.5 seconds
        setTimeout(() => setLastScannedMember(null), 4500);

        setAttendanceFeed((prev) => [
          {
            id: String(Date.now()),
            memberId: res.member?.id || "keypad",
            checkedInAt: new Date().toISOString(),
            method: finalMode === "exit" ? "kiosk_exit" : "kiosk_entry",
            verifiedBy: "Keypad Pass",
          },
          ...prev.slice(0, 5),
        ]);

        // Instantly rotate QR code for next person in line
        handleRefreshQr(true);

        // Auto-close dialog after 3.2 seconds on success
        setTimeout(() => {
          setIsPinModalOpen(false);
          setPhoneInput("");
          setKeypadResult(null);
        }, 3200);
      } else {
        if (soundEnabled) playDeniedBuzz();
        toast.error(res.message);
      }
    } catch {
      if (soundEnabled) playDeniedBuzz();
      toast.error("Error communicating with check-in system");
    } finally {
      setPhoneSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-5 sm:p-7 rounded-2xl border border-white/[0.08] bg-[#0c0e12]/60 shadow-xl space-y-6 select-none relative overflow-hidden">
      {/* Top Header Controls (embedded preview panel) */}
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.07] text-zinc-400 hover:text-white transition-colors"
            title="Exit to Admin Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="font-extrabold text-sm tracking-wider text-white font-mono block">
              GYMERP KIOSK
            </span>
            <p className="text-xs text-zinc-400">
              Point phone camera at screen to mark attendance
            </p>
          </div>
        </div>

        {/* Hardware Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors"
            title={soundEnabled ? "Mute audio chimes" : "Enable audio chimes"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-600" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Kiosk Mode"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Kiosk Center Stage */}
      <div className="flex flex-col items-center justify-center py-2 space-y-6 relative">
        {/* Dynamic Flash Announcement upon member scan */}
        <AnimatePresence>
          {lastScannedMember && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              className="px-5 py-2.5 rounded-2xl border border-primary/40 bg-primary/20 shadow-2xl flex items-center gap-3 backdrop-blur-xl text-emerald-200"
            >
              <div className="w-7 h-7 rounded-full bg-primary text-black flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">
                  {lastScannedMember.name}
                </p>
                <p className="text-xs text-zinc-300 font-mono">
                  {lastScannedMember.mode === "exit" ? "Checked Out" : "Checked In"} • Access Granted ({lastScannedMember.time})
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shared KioskQrDisplay */}
        <KioskQrDisplay
          qrDataUrl={qrData.qrDataUrl}
          remainingSeconds={remainingSecs}
          totalSeconds={20}
          onRefresh={() => handleRefreshQr(false)}
          refreshing={refreshing}
          title="Scan Pass to Enter or Exit"
          subtitle="Open your phone camera • Point at the QR code below • Attendance recorded"
        />

        {/* 3 Step Visual Guide & Dead Phone Fallback */}
        <div className="flex flex-col items-center justify-center gap-3 pt-1">
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-300">
              <Smartphone className="w-3.5 h-3.5 text-primary" />
              <span>1. Open Members portal</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>2. Scan QR Code for Check-In/Check-Out</span>
            </div>
          </div>

          <button
            onClick={() => setIsPinModalOpen(true)}
            className="text-xs text-zinc-400 hover:text-white underline underline-offset-4 transition-colors font-medium cursor-pointer"
          >
            Phone dead or no camera? Check in with Phone Number
          </button>
        </div>
      </div>

      {/* Manual Phone/PIN Check-In Dialog for dead batteries */}
      <Dialog
        open={isPinModalOpen}
        onOpenChange={(open) => {
          setIsPinModalOpen(open);
          if (!open) {
            setKeypadResult(null);
            setPhoneInput("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-[#0c0d10] border border-white/[0.1] text-zinc-100 p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Manual Pass Check-In</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Type your registered phone number or Member Pass ID to record entry or exit.
            </DialogDescription>
          </DialogHeader>

          {/* Expired Member Card View */}
          {keypadResult && keypadResult.expired && keypadResult.member && (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-red-500/15 to-[#0c0d10] border border-red-500/40 text-center space-y-4 my-2">
              <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                  Access Denied
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight mt-1.5">
                  {keypadResult.member.fullName}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left p-3.5 rounded-lg bg-[#08090a] border border-white/[0.08] text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Athlete ID</span>
                  <span className="text-zinc-200 font-bold">#{keypadResult.member.id.slice(0, 8)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Status</span>
                  <span className="text-red-400 font-bold uppercase">Expired</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Joined</span>
                  <span className="text-zinc-400">{keypadResult.member.joinDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Expired On</span>
                  <span className="text-red-400 font-bold">{keypadResult.member.expiryDate}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-300 font-medium">
                Please visit the front desk to renew your pass before entering.
              </div>

              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setKeypadResult(null);
                    setPhoneInput("");
                  }}
                  className="w-full border-white/[0.1] text-xs text-zinc-300 hover:bg-white/[0.05] rounded-lg"
                >
                  Try Another Number
                </Button>
              </div>
            </div>
          )}

          {/* Active Member Card View */}
          {keypadResult && keypadResult.success && keypadResult.member && (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-primary/15 to-[#0c0d10] border border-primary/40 shadow-[0_0_35px_rgba(62,207,142,0.2)] text-center space-y-4 my-2">
              <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/40 text-primary flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {keypadResult.mode === "exit" ? "Exit Logged" : "Access Granted"}
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight mt-1.5">
                  {keypadResult.member.fullName}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left p-3.5 rounded-lg bg-[#08090a] border border-white/[0.08] text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Athlete ID</span>
                  <span className="text-zinc-200 font-bold">#{keypadResult.member.id.slice(0, 8)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Status</span>
                  <span className="text-primary font-bold uppercase">Active</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Joined</span>
                  <span className="text-zinc-400">{keypadResult.member.joinDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Valid Until</span>
                  <span className="text-emerald-400 font-bold">{keypadResult.member.expiryDate}</span>
                </div>
              </div>

              <p className="text-xs text-primary font-medium">Check-in Confirmed. Welcome!</p>
            </div>
          )}

          {/* Keypad Form Input (shown when not displaying card result) */}
          {(!keypadResult || (!keypadResult.success && !keypadResult.expired)) && (
            <form onSubmit={handlePhoneCheckInSubmit} className="space-y-4 pt-2">
              <Input
                type="tel"
                required
                autoFocus
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Phone number or Pass ID"
                className="bg-[#14161b] border-white/[0.1] text-center text-lg tracking-widest font-mono h-12 rounded-lg text-white focus:border-primary"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPinModalOpen(false)}
                  className="border-white/[0.08] text-xs text-zinc-300 hover:bg-white/[0.05] rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={phoneSubmitting || !phoneInput.trim()}
                  className="bg-primary hover:bg-primary-deep text-[#08090a] font-semibold text-xs px-5 rounded-lg"
                >
                  {phoneSubmitting ? "Verifying..." : "Confirm Entrance"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
