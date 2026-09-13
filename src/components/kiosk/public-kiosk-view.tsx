"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Unlock,
  KeyRound,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Smartphone,
  AlertCircle,
  Dumbbell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  verifyKioskPassphraseAction,
  getPublicKioskRotatingQrAction,
  lockKioskAction,
} from "@/lib/api/kiosk";
import { UniqueQrData } from "@/lib/attendance/qr";
import { KioskQrDisplay } from "@/components/kiosk/kiosk-qr-display";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PublicKioskViewProps {
  gym: {
    id?: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
  initialQr?: UniqueQrData;
  isUnlocked: boolean;
}

export function PublicKioskView({ gym, initialQr, isUnlocked: initialUnlocked }: PublicKioskViewProps) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [passphrase, setPassphrase] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Kiosk Terminal State (mode is hardcoded to "auto")
  const [qrData, setQrData] = useState<UniqueQrData | null>(initialQr || null);
  const [remainingSeconds, setRemainingSeconds] = useState(20);
  const [refreshing, setRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch next dynamic rotating QR (always in "auto" mode)
  const fetchNewQr = useCallback(async () => {
    if (!unlocked) return;
    setRefreshing(true);
    try {
      const res = await getPublicKioskRotatingQrAction(gym.slug, "auto");
      if (res.success && res.qr) {
        setQrData(res.qr);
        setRemainingSeconds(20);
      } else if (res.error === "Kiosk station is locked") {
        setUnlocked(false);
      }
    } catch {
      // silently retry on next cycle
    } finally {
      setRefreshing(false);
    }
  }, [gym.slug, unlocked]);

  // Countdown timer for rotating QR
  useEffect(() => {
    if (!unlocked) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          fetchNewQr();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [unlocked, fetchNewQr]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Handle Passphrase Unlock
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) return;

    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await verifyKioskPassphraseAction(gym.slug, passphrase);
      if (res.success) {
        toast.success("Station unlocked successfully!");
        setUnlocked(true);
        router.refresh();
      } else {
        setAuthError(res.message || "Incorrect passphrase");
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to verify passphrase");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Lock Kiosk
  const handleLock = async () => {
    await lockKioskAction(gym.slug);
    setUnlocked(false);
    setPassphrase("");
    toast.info("Kiosk station locked");
  };

  // ==========================================
  // VIEW 1: LOCKED STATION SCREEN
  // ==========================================
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#060709] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
        {/* Ambient Subtle Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[140px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6 relative z-10"
        >
          {/* Gym Branding */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 text-[#08090a] flex items-center justify-center font-black text-2xl mx-auto shadow-lg">
              <Dumbbell className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">{gym.name}</h1>
            <p className="text-xs text-zinc-400 font-medium">Entrance Check-In Station</p>
          </div>

          {/* Unlock Passcode Card */}
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0c0e12]/80 backdrop-blur-2xl shadow-2xl space-y-5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-white/[0.06]">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Station Locked</h2>
                <p className="text-[11px] text-zinc-400">Enter station PIN to activate camera scanner</p>
              </div>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  required
                  autoFocus
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Station Passcode / PIN"
                  className="h-11 bg-black/40 border-white/[0.1] text-center text-base tracking-widest font-mono text-white rounded-lg focus:border-primary"
                />

                {authError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium justify-center">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authError}</span>
                  </p>
                )}
              </div>

              {/* Quick Keypad */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "←"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (key === "C") setPassphrase("");
                      else if (key === "←") setPassphrase((p) => p.slice(0, -1));
                      else setPassphrase((p) => p + key);
                    }}
                    className="h-10 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/[0.06] text-sm font-mono font-semibold text-zinc-200 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    {key}
                  </button>
                ))}
              </div>

              <Button
                type="submit"
                disabled={authLoading || !passphrase.trim()}
                className="w-full h-10 bg-primary hover:bg-primary-deep text-[#08090a] font-bold text-xs rounded-lg gap-2 shadow-lg transition-all"
              >
                {authLoading ? (
                  <>
                    <Spinner size="sm" className="text-[#08090a]" />
                    <span>Unlocking Terminal...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Launch Kiosk Terminal</span>
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>GymERP Secure Kiosk Subsystem</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: UNLOCKED LIVE KIOSK TERMINAL (Fullscreen View)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#050608] text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden select-none">
      {/* Dynamic Ambient Energy Aura (Single Primary Green Theme) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] bg-gradient-to-tr from-primary/15 via-emerald-500/10 to-transparent rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.08] pb-4 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 text-[#08090a] flex items-center justify-center font-black text-lg shadow-[0_0_16px_rgba(62,207,142,0.35)]">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">{gym.name}</h1>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Check-In Station</span>
              <span>•</span>
              <span className="font-mono text-zinc-300">{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Controls: Fullscreen, Lock Station (no mode switchers) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0 border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:text-white rounded-lg"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLock}
            className="h-8 px-2.5 border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs gap-1.5"
            title="Lock Kiosk Terminal"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock Station</span>
          </Button>
        </div>
      </header>

      {/* Main Center Area: Shared KioskQrDisplay */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-6 space-y-6">
        {qrData?.qrDataUrl ? (
          <KioskQrDisplay
            qrDataUrl={qrData.qrDataUrl}
            remainingSeconds={remainingSeconds}
            totalSeconds={20}
            onRefresh={fetchNewQr}
            refreshing={refreshing}
            title="Scan Pass to Enter or Exit"
            subtitle="Open your phone camera • Point at the QR code below • Attendance recorded"
          />
        ) : (
          <div className="w-64 h-64 flex items-center justify-center">
            <Spinner size="lg" className="text-primary" />
          </div>
        )}
      </main>

      {/* Footer Instructions */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 font-medium border-t border-white/[0.06] pt-4">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary" />
          <span>Members: Point phone camera or open gym portal to scan</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>Station ID: #{gym.slug.toUpperCase()}</span>
          <span>•</span>
          <span className="text-emerald-400">Station Active</span>
        </div>
      </footer>
    </div>
  );
}
