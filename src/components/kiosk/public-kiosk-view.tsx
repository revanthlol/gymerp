"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Unlock,
  KeyRound,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  AlertCircle,
  LogIn,
  LogOut,
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
import { UniqueQrData, KioskMode } from "@/lib/attendance/qr";
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

// Synthesize pleasant check-in arrival chime using browser Web Audio API
function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio playback blocked or unsupported
  }
}

export function PublicKioskView({ gym, initialQr, isUnlocked: initialUnlocked }: PublicKioskViewProps) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [passphrase, setPassphrase] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Kiosk Terminal State
  const [qrData, setQrData] = useState<UniqueQrData | null>(initialQr || null);
  const [mode, setMode] = useState<KioskMode>("entry");
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

  // Fetch next dynamic rotating QR
  const fetchNewQr = useCallback(async () => {
    if (!unlocked) return;
    setRefreshing(true);
    try {
      const res = await getPublicKioskRotatingQrAction(gym.slug, mode);
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
  }, [gym.slug, mode, unlocked]);

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
  // VIEW 1: LOCKED SCREEN (Passphrase Entry)
  // ==========================================
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#060709] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
        {/* Dynamic Background Glow Mesh */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-primary/20 via-emerald-500/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6 relative z-10"
        >
          {/* Gym Branding */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-500/10 border border-primary/30 flex items-center justify-center mx-auto text-primary shadow-[0_0_30px_rgba(62,207,142,0.25)]">
              <Dumbbell className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">{gym.name}</h1>
            <p className="text-xs text-zinc-400 font-medium">Front-Desk Check-In Station Terminal</p>
          </div>

          {/* Passphrase Card */}
          <div className="glass-panel p-8 rounded-3xl border border-white/[0.08] bg-[#0c0d11]/80 backdrop-blur-2xl shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Terminal Protected</h2>
                <p className="text-xs text-zinc-400">Enter kiosk passphrase to launch station</p>
              </div>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              {authError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">Station Passphrase / PIN</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    type="password"
                    placeholder="Enter station passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="pl-10 h-11 bg-black/40 border-white/[0.1] text-white text-sm rounded-xl focus:border-primary focus:ring-1 focus:ring-primary font-mono tracking-wider"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Numpad Helper for Touchscreen Tablets */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "←"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (key === "C") setPassphrase("");
                      else if (key === "←") setPassphrase((p) => p.slice(0, -1));
                      else setPassphrase((p) => p + key);
                    }}
                    className="h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/[0.06] text-sm font-mono font-semibold text-zinc-200 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    {key}
                  </button>
                ))}
              </div>

              <Button
                type="submit"
                disabled={authLoading || !passphrase.trim()}
                className="w-full h-11 bg-primary hover:bg-primary-deep text-[#08090a] font-bold text-sm rounded-xl gap-2 shadow-[0_0_20px_rgba(62,207,142,0.3)] transition-all"
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
  // VIEW 2: UNLOCKED LIVE KIOSK TERMINAL
  // ==========================================
  return (
    <div className="min-h-screen bg-[#050608] text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden select-none">
      {/* Dynamic Ambient Energy Aura */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-primary/20 via-cyan-500/15 to-transparent rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.08] pb-4 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 text-[#08090a] flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(62,207,142,0.4)]">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">{gym.name}</h1>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Check-In Station</span>
              <span>•</span>
              <span className="font-mono text-zinc-300">{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Controls: Mode toggle, Fullscreen, Lock */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Entry vs Exit Mode Switch */}
          <div className="p-1 rounded-xl bg-[#0e1015] border border-white/[0.08] flex items-center gap-1">
            <button
              onClick={() => {
                setMode("entry");
                fetchNewQr();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === "entry"
                  ? "bg-primary text-[#08090a] shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Arrival</span>
            </button>
            <button
              onClick={() => {
                setMode("exit");
                fetchNewQr();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === "exit"
                  ? "bg-amber-400 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Departure</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="h-9 w-9 p-0 border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:text-white rounded-xl"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLock}
            className="h-9 px-3 border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-xs gap-1.5"
            title="Lock Kiosk Terminal"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock Station</span>
          </Button>
        </div>
      </header>

      {/* Main Center Area: Large Dynamic Rotating QR Code */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/[0.1] bg-[#0c0e12]/90 backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.8)] flex flex-col items-center text-center space-y-6 max-w-lg w-full relative"
        >
          {/* Subtle Outer Neon Ring Accent */}
          <div className="absolute -inset-[1px] bg-gradient-to-b from-primary/30 via-transparent to-cyan-500/20 rounded-3xl -z-10 pointer-events-none" />

          {/* Prompt Header */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {mode === "entry" ? "Instant Entrance Check-In" : "Workout Check-Out"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Scan with Phone Camera
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Open your camera or the GymERP member app to record your workout attendance.
            </p>
          </div>

          {/* High-Resolution Dynamic QR Display */}
          <div className="relative p-5 bg-white rounded-3xl shadow-2xl overflow-hidden group">
            {qrData?.qrDataUrl ? (
              <img
                src={qrData.qrDataUrl}
                alt="GymERP Live Dynamic Check-in QR"
                className="w-64 h-64 sm:w-72 sm:h-72 object-contain select-none"
              />
            ) : (
              <div className="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                <Spinner size="lg" className="text-black" />
              </div>
            )}

            {/* Corner Scan Accent Brackets */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg pointer-events-none" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg pointer-events-none" />
          </div>

          {/* Countdown Progress & Rotation Status */}
          <div className="w-full space-y-2 max-w-xs">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Anti-Screenshot Protected</span>
              </span>
              <span className="font-bold text-primary">{remainingSeconds}s</span>
            </div>

            {/* Rotating Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full"
                animate={{ width: `${(remainingSeconds / 20) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={fetchNewQr}
                disabled={refreshing}
                className="text-[11px] font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
                <span>Rotate Code Now</span>
              </button>
            </div>
          </div>
        </motion.div>
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
