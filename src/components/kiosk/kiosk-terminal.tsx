"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
  Smartphone,
  DoorOpen,
  LogOut,
  Keyboard,
  Phone,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { KioskMode, UniqueQrData } from "@/lib/attendance/qr";
import {
  playSuccessChime,
  playDeniedBuzz,
  playDuplicateNotice,
} from "@/lib/kiosk/audio";
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
  initialQr: UniqueQrData;
  members: MemberItem[];
  recentAttendance: AttendanceItem[];
  defaultMode?: KioskMode;
}

export function KioskTerminal({
  initialQr,
  members,
  recentAttendance,
  defaultMode = "entry",
}: KioskTerminalProps) {
  const [kioskMode, setKioskMode] = useState<KioskMode>(defaultMode);
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

  // Refresh QR code when kioskMode changes
  useEffect(() => {
    handleRefreshQr(kioskMode, true);
  }, [kioskMode]);

  // Anti-proxy live countdown timer: rotates every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSecs((prev) => {
        if (prev <= 1) {
          handleRefreshQr(kioskMode, true);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [kioskMode]);

  const handleRefreshQr = async (mode: KioskMode = kioskMode, silent = false) => {
    if (!isOnline) {
      if (!silent) toast.info("Offline mode: Local QR remaining active.");
      return;
    }

    setRefreshing(true);
    try {
      const refreshed = await getRotatingQrAction(mode);
      setQrData(refreshed);
      setRemainingSecs(refreshed.remainingSeconds || 20);
      if (!silent) {
        toast.success(`Kiosk QR rotated for ${mode.toUpperCase()} mode`);
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
        const res = await staffManualCheckInAction(item.memberId, kioskMode === "exit" ? "exit" : "entry");
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
        mode: kioskMode,
      });

      setKeypadResult(res);

      if (res.success) {
        if (soundEnabled) playSuccessChime();
        toast.success(res.message);

        setLastScannedMember({
          name: res.member?.fullName || "Athlete",
          mode: kioskMode === "exit" ? "exit" : "entry",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });

        // Flash banner auto-dismisses after 4.5 seconds
        setTimeout(() => setLastScannedMember(null), 4500);

        setAttendanceFeed((prev) => [
          {
            id: String(Date.now()),
            memberId: res.member?.id || "keypad",
            checkedInAt: new Date().toISOString(),
            method: kioskMode === "exit" ? "kiosk_exit" : "kiosk_entry",
            verifiedBy: "Keypad Pass",
          },
          ...prev.slice(0, 5),
        ]);

        // Instantly rotate QR code for next person in line
        handleRefreshQr(kioskMode, true);

        // Auto-close dialog after 3.2 seconds on success
        setTimeout(() => {
          setIsPinModalOpen(false);
          setPhoneInput("");
          setKeypadResult(null);
        }, 3200);
      } else if (res.expired) {
        if (soundEnabled) playDeniedBuzz();
        toast.error(res.message);
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

  const getMemberName = (id: string) => {
    const found = members.find((m) => m.id === id);
    return found ? found.fullName : "Gym Athlete";
  };

  // Theme highlights based on mode
  const modeColor =
    kioskMode === "exit"
      ? "amber"
      : kioskMode === "auto"
      ? "cyan"
      : "emerald";

  return (
    <div className="min-h-screen bg-[#060709] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none relative overflow-hidden">
      {/* Subtle Atmospheric Lighting Aura */}
      <div
        className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 ${
          kioskMode === "exit"
            ? "bg-amber-500/10"
            : kioskMode === "auto"
            ? "bg-cyan-500/10"
            : "bg-primary/10"
        }`}
      />

      {/* Top Header Controls */}
      <header className="relative z-10 flex items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.07] text-zinc-400 hover:text-white transition-colors"
            title="Exit to Admin Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wider text-white font-mono">
                GYMERP KIOSK
              </span>
              <span
                className={`text-[11px] capitalize font-medium px-2 py-0.5 rounded-md border ${
                  kioskMode === "exit"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : kioskMode === "auto"
                    ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}
              >
                {kioskMode === "exit"
                  ? "Exit Scanner"
                  : kioskMode === "auto"
                  ? "Smart Dual Station"
                  : "Entrance Station"}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Point phone camera at screen to mark attendance
            </p>
          </div>
        </div>

        {/* Mode Selector & Hardware Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher Pill */}
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs">
            <button
              onClick={() => setKioskMode("entry")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                kioskMode === "entry"
                  ? "bg-primary text-[#08090a] font-semibold shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Entry Mode
            </button>
            <button
              onClick={() => setKioskMode("exit")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                kioskMode === "exit"
                  ? "bg-amber-400 text-[#08090a] font-semibold shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Exit Mode
            </button>
            <button
              onClick={() => setKioskMode("auto")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                kioskMode === "auto"
                  ? "bg-cyan-400 text-[#08090a] font-semibold shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Auto Detect
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-white"
            title={soundEnabled ? "Mute audio chimes" : "Enable audio chimes"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-600" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-white"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Kiosk Mode"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Kiosk Center Stage */}
      <main className="relative z-10 my-auto flex flex-col items-center justify-center py-6">
        {/* Dynamic Flash Announcement upon member scan */}
        <AnimatePresence>
          {lastScannedMember && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`absolute top-0 z-30 px-6 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-xl ${
                lastScannedMember.mode === "exit"
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-200"
                  : "bg-primary/20 border-primary/40 text-emerald-200"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  lastScannedMember.mode === "exit"
                    ? "bg-amber-400 text-black"
                    : "bg-primary text-black"
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {lastScannedMember.name}
                </p>
                <p className="text-xs text-zinc-300 font-mono">
                  {lastScannedMember.mode === "exit" ? "Checked Out" : "Checked In"} • Gate Unlocked ({lastScannedMember.time})
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-xl text-center space-y-6">
          {/* Dynamic Instructions */}
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {kioskMode === "exit"
                ? "Scan Out for Exit"
                : kioskMode === "auto"
                ? "Scan Pass to Enter or Exit"
                : "Scan Pass for Gym Entry"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-normal">
              Open your phone camera • Point at the QR code below • Attendance recorded
            </p>
          </div>

          {/* Prominent High-Contrast Dynamic QR Code */}
          <div className="relative inline-block mx-auto">
            {/* Pulsing Border Glow */}
            <div
              className={`absolute -inset-3 rounded-3xl opacity-40 blur-xl transition-all duration-500 ${
                kioskMode === "exit"
                  ? "bg-amber-500"
                  : kioskMode === "auto"
                  ? "bg-cyan-400"
                  : "bg-primary"
              }`}
            />

            <div className="relative p-5 sm:p-7 rounded-3xl bg-[#0c0d10] border border-white/[0.12] shadow-[0_24px_60px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={qrData.tokenString}
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.94, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center"
                >
                  <img
                    src={qrData.qrDataUrl}
                    alt="Dynamic Check-in QR"
                    className="w-64 h-64 sm:w-80 sm:h-80 object-contain select-none"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Progress Countdown Bar */}
              <div className="w-full mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono px-1">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Anti-proxy code rotates in:</span>
                  </div>
                  <span
                    className={`font-bold ${
                      kioskMode === "exit"
                        ? "text-amber-400"
                        : kioskMode === "auto"
                        ? "text-cyan-400"
                        : "text-primary"
                    }`}
                  >
                    {remainingSecs}s
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      kioskMode === "exit"
                        ? "bg-amber-400"
                        : kioskMode === "auto"
                        ? "bg-cyan-400"
                        : "bg-primary"
                    }`}
                    style={{ width: `${(remainingSecs / 20) * 100}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3 Step Visual Guide & Dead Phone Fallback */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-300">
              <Smartphone className="w-3.5 h-3.5 text-primary" />
              <span>1. Open Camera</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>2. Scan Screen</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>3. Gate Unlocks</span>
            </div>
          </div>

          {/* Fallback button if member phone battery is dead */}
          <div className="pt-1">
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="text-xs text-zinc-400 hover:text-white underline underline-offset-4 transition-colors font-medium"
            >
              Phone dead or no camera? Check in with Phone Number
            </button>
          </div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/[0.07] pt-4 text-xs font-mono text-zinc-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isOnline ? "bg-primary" : "bg-amber-400"
              }`}
            />
            <span>{isOnline ? "Cloud Gate Controller Online" : "Offline Storage Active"}</span>
          </div>
          <span>•</span>
          <span>Single-Use Nonce Security</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleRefreshQr(kioskMode, false)}
            disabled={refreshing}
            className="hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Force Rotate QR</span>
          </button>
        </div>
      </footer>

      {/* Manual Phone/PIN Check-In Dialog for dead batteries */}
      <Dialog open={isPinModalOpen} onOpenChange={(open) => {
        setIsPinModalOpen(open);
        if (!open) {
          setKeypadResult(null);
          setPhoneInput("");
        }
      }}>
        <DialogContent className="sm:max-w-md bg-[#0c0d10] border border-white/[0.1] text-zinc-100 p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              <span>Kiosk Keypad Check-In</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Enter your registered phone number or Gym Pass ID.
            </DialogDescription>
          </DialogHeader>

          {/* Expired Member Card View */}
          {keypadResult && keypadResult.expired && keypadResult.member && (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-red-950/40 to-[#0c0d10] border border-red-500/50 shadow-[0_0_35px_rgba(239,68,68,0.2)] text-center space-y-4 my-2">
              <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                  Membership Expired
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight mt-1.5">
                  {keypadResult.member.fullName}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left p-3.5 rounded-xl bg-[#08090a] border border-white/[0.08] text-xs font-mono">
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
                  className="w-full border-white/[0.1] text-xs text-zinc-300 hover:bg-white/[0.05]"
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
                <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {kioskMode === "exit" ? "Exit Logged" : "Access Granted"}
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight mt-1.5">
                  {keypadResult.member.fullName}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left p-3.5 rounded-xl bg-[#08090a] border border-white/[0.08] text-xs font-mono">
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
                className="bg-[#14161b] border-white/[0.1] text-center text-lg tracking-widest font-mono h-12 rounded-xl text-white focus:border-primary"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPinModalOpen(false)}
                  className="border-white/[0.08] text-xs text-zinc-300 hover:bg-white/[0.05]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={phoneSubmitting || !phoneInput.trim()}
                  className="bg-primary hover:bg-primary-deep text-[#08090a] font-semibold text-xs px-5"
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
