"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Maximize2,
  Minimize2,
  Wifi,
  WifiOff,
  Sparkles,
  ArrowRightLeft,
  LogIn,
  LogOut,
  ShieldCheck,
  Dumbbell,
  Calendar,
} from "lucide-react";
import { playSuccessChime, playDeniedBuzz, playDuplicateNotice } from "@/lib/kiosk/audio";
import { KioskScanEvent } from "@/lib/kiosk/kiosk-events";

interface StationDisplayProps {
  kiosk: {
    id: string;
    name: string;
    slug: string;
    secretToken: string;
    mode: "auto" | "entry" | "exit" | string;
    lastHeartbeatAt?: Date | string | null;
  };
  gym: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
  qrDataUrl: string;
  scanUrl: string;
}

export function StationDisplay({
  kiosk,
  gym,
  qrDataUrl,
  scanUrl,
}: StationDisplayProps) {
  // Clock state
  const [time, setTime] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "offline">("connecting");
  const [activeOverlay, setActiveOverlay] = useState<KioskScanEvent | null>(null);
  const [countdownPercent, setCountdownPercent] = useState<number>(100);

  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedEventIdRef = useRef<string | null>(null);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Trigger full-screen verification overlay
  const triggerOverlay = useCallback((event: KioskScanEvent) => {
    // Avoid double-processing the same scan
    if (lastProcessedEventIdRef.current === event.id) return;
    lastProcessedEventIdRef.current = event.id;

    // Clear previous timers if any
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Audio cue
    if (event.success) {
      if (event.duplicate) {
        playDuplicateNotice();
      } else {
        playSuccessChime();
      }
    } else {
      playDeniedBuzz();
    }

    setActiveOverlay(event);
    setCountdownPercent(100);

    const DURATION_MS = 3800;
    const intervalStep = 50;
    const totalSteps = DURATION_MS / intervalStep;
    let step = 0;

    countdownIntervalRef.current = setInterval(() => {
      step += 1;
      const remaining = Math.max(0, 100 - (step / totalSteps) * 100);
      setCountdownPercent(remaining);
      if (step >= totalSteps) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      }
    }, intervalStep);

    overlayTimerRef.current = setTimeout(() => {
      setActiveOverlay(null);
    }, DURATION_MS);
  }, []);

  // Connect live Server-Sent Events (SSE) with polling fallback
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const connectSSE = () => {
      if (isCancelled) return;
      try {
        const sseUrl = `/api/kiosk/events?token=${encodeURIComponent(kiosk.secretToken)}`;
        eventSource = new EventSource(sseUrl);

        eventSource.onopen = () => {
          if (!isCancelled) {
            setConnectionStatus("connected");
          }
        };

        eventSource.addEventListener("connected", () => {
          if (!isCancelled) setConnectionStatus("connected");
        });

        eventSource.addEventListener("scan", (e) => {
          if (isCancelled) return;
          try {
            const data: KioskScanEvent = JSON.parse(e.data);
            triggerOverlay(data);
          } catch (err) {
            console.error("Failed to parse kiosk scan event", err);
          }
        });

        eventSource.onerror = () => {
          if (!isCancelled) {
            setConnectionStatus("connecting");
            // SSE will automatically attempt reconnection
          }
        };
      } catch {
        if (!isCancelled) setConnectionStatus("offline");
      }
    };

    connectSSE();

    // Fallback polling every 2.5s for environments where SSE is buffered or closed
    let lastPollTime = Date.now() - 5000;
    pollInterval = setInterval(async () => {
      if (isCancelled) return;
      try {
        const res = await fetch(
          `/api/kiosk/events?token=${encodeURIComponent(kiosk.secretToken)}&poll=true&since=${lastPollTime}`
        );
        if (res.ok) {
          const json = await res.json();
          lastPollTime = Date.now();
          if (json.events && json.events.length > 0) {
            // Process newest event
            triggerOverlay(json.events[0]);
          }
          if (connectionStatus === "offline") {
            setConnectionStatus("connected");
          }
        }
      } catch {
        // network issue
      }
    }, 2500);

    // Heartbeat ping every 30s
    const heartbeatInterval = setInterval(() => {
      fetch("/api/kiosk/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: kiosk.secretToken }),
      }).catch(() => {});
    }, 30000);

    return () => {
      isCancelled = true;
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [kiosk.secretToken, triggerOverlay]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const modeBadge =
    kiosk.mode === "entry" ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <LogIn className="w-3.5 h-3.5" />
        <span>Entry Turnstile Only</span>
      </span>
    ) : kiosk.mode === "exit" ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <LogOut className="w-3.5 h-3.5" />
        <span>Exit Turnstile Only</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
        <ArrowRightLeft className="w-3.5 h-3.5" />
        <span>Auto-Detect Entry & Exit</span>
      </span>
    );

  return (
    <div className="min-h-screen w-full bg-[#07080a] text-zinc-100 flex flex-col justify-between p-6 md:p-10 select-none relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-primary/[0.07] rounded-full blur-[160px] pointer-events-none" />

      {/* TOP HEADER */}
      <header className="relative z-10 w-full flex items-center justify-between pb-4 border-b border-white/[0.06]">
        {/* Left: Branding & Station */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-[#07080a] flex items-center justify-center font-black text-xl shadow-lg shadow-primary/20">
            {gym.logoUrl ? (
              <img src={gym.logoUrl} alt={gym.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <Dumbbell className="w-6 h-6 stroke-[2.5]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white uppercase">
                {gym.name}
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[11px] font-mono text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold">{kiosk.name}</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 tracking-wide mt-0.5">
              Zero-Touch Smart Turnstile Terminal
            </p>
          </div>
        </div>

        {/* Right: Clock & Status */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="text-right">
            <div className="text-xl md:text-2xl font-bold font-mono text-white tracking-wider">
              {time || "00:00:00"}
            </div>
            <div className="text-[11px] font-medium text-zinc-400 tracking-wide">
              {dateStr}
            </div>
          </div>

          <div className="flex items-center gap-2 pl-3 border-l border-white/[0.08]">
            <div
              title={connectionStatus === "connected" ? "Live Stream Connected" : "Connecting..."}
              className={`p-2 rounded-xl border ${
                connectionStatus === "connected"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}
            >
              {connectionStatus === "connected" ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4 animate-pulse" />
              )}
            </div>

            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* CENTER: ZERO-TOUCH QR HERO */}
      <main className="relative z-10 my-auto flex flex-col items-center justify-center text-center py-6">
        <div className="space-y-6 max-w-xl mx-auto flex flex-col items-center">
          {/* Header instructions */}
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center">
              {modeBadge}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Scan Pass to Enter
            </h2>
            <p className="text-sm md:text-base text-zinc-400 max-w-md mx-auto">
              Open your phone camera and point at the code. Zero touch required.
            </p>
          </div>

          {/* High-Contrast Scannable QR Frame */}
          <div className="relative group p-6 sm:p-8 rounded-3xl bg-[#0e1014] border-2 border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center">
            {/* Corner aesthetic brackets */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-primary rounded-tl-lg" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-primary rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-primary rounded-br-lg" />

            {/* Inset White Container */}
            <div className="bg-white p-5 md:p-6 rounded-2xl shadow-inner flex items-center justify-center">
              <img
                src={qrDataUrl}
                alt="Station QR Check-In"
                className="w-64 h-64 md:w-80 md:h-80 object-contain select-none"
              />
            </div>

            {/* Live radar scanner pulse animation */}
            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="text-zinc-300">Station Active & Listening</span>
            </div>
          </div>

          {/* Instructions Footer */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-lg text-left pt-2">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
              <div className="font-bold text-white mb-0.5">1. Open Camera</div>
              <div className="text-[11px] text-zinc-400">Any iOS or Android phone camera</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
              <div className="font-bold text-white mb-0.5">2. Tap Link</div>
              <div className="text-[11px] text-zinc-400">Instant check-in without app install</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
              <div className="font-bold text-white mb-0.5">3. Walk Through</div>
              <div className="text-[11px] text-zinc-400">Turnstile unlocks instantly</div>
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM FOOTER */}
      <footer className="relative z-10 w-full flex items-center justify-between pt-4 border-t border-white/[0.06] text-xs text-zinc-500 font-mono">
        <div className="flex items-center gap-2">
          <span>GymERP Station Engine v3.0</span>
          <span>•</span>
          <span className="text-zinc-400">Token: #{kiosk.secretToken.slice(0, 8)}</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-zinc-400">Enterprise Anti-Passback & Cooldown Protected</span>
        </div>
      </footer>

      {/* FULLSCREEN VERIFICATION OVERLAY (ANIMATED TAKEOVER) */}
      <AnimatePresence>
        {activeOverlay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-8 md:p-14 ${
              activeOverlay.success
                ? activeOverlay.duplicate
                  ? "bg-amber-950/95 border-amber-500/40"
                  : "bg-emerald-950/95 border-emerald-500/40"
                : "bg-red-950/95 border-red-500/40"
            } backdrop-blur-3xl border-4 text-white shadow-2xl`}
          >
            {/* Top Bar inside Overlay */}
            <div className="w-full flex items-center justify-between text-sm font-mono opacity-80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                <span>GYMERP TURNSTILE VERIFICATION</span>
              </div>
              <div>{time}</div>
            </div>

            {/* Main Center Callout */}
            <div className="my-auto text-center space-y-6 max-w-2xl flex flex-col items-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center shadow-2xl ${
                  activeOverlay.success
                    ? activeOverlay.duplicate
                      ? "bg-amber-500/20 text-amber-300 border-4 border-amber-400/50 shadow-[0_0_50px_rgba(245,158,11,0.3)]"
                      : "bg-emerald-500/20 text-emerald-300 border-4 border-emerald-400/50 shadow-[0_0_50px_rgba(16,185,129,0.3)]"
                    : "bg-red-500/20 text-red-300 border-4 border-red-400/50 shadow-[0_0_50px_rgba(239,68,68,0.3)]"
                }`}
              >
                {activeOverlay.success ? (
                  activeOverlay.duplicate ? (
                    <AlertTriangle className="w-20 h-20 md:w-24 md:h-24 stroke-[2.2]" />
                  ) : (
                    <CheckCircle2 className="w-20 h-20 md:w-24 md:h-24 stroke-[2.2]" />
                  )
                ) : (
                  <XCircle className="w-20 h-20 md:w-24 md:h-24 stroke-[2.2]" />
                )}
              </motion.div>

              {/* Status Badge */}
              <div className="space-y-3">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs md:text-sm font-bold tracking-wider uppercase ${
                    activeOverlay.success
                      ? activeOverlay.duplicate
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-red-500/20 text-red-300 border border-red-500/40"
                  }`}
                >
                  {activeOverlay.success ? (
                    activeOverlay.duplicate ? (
                      "SCAN COOLDOWN ACTIVE"
                    ) : activeOverlay.mode === "exit" ? (
                      "EXIT LOGGED · HAVE A GREAT DAY"
                    ) : (
                      "ACCESS GRANTED · ENTRY LOGGED"
                    )
                  ) : (
                    activeOverlay.expired ? "MEMBERSHIP EXPIRED" : "ACCESS DENIED"
                  )}
                </div>

                {/* Athlete Name */}
                <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-md">
                  {activeOverlay.memberName || "Gym Athlete"}
                </h2>

                <p className="text-lg md:text-xl text-zinc-200 font-medium max-w-lg mx-auto">
                  {activeOverlay.message}
                </p>
              </div>

              {/* Member Card Details if present */}
              {activeOverlay.memberCard && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center justify-center gap-4 bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-xs md:text-sm font-mono text-zinc-300"
                >
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Plan Status</span>
                    <span className="font-bold text-white uppercase">
                      {activeOverlay.memberCard.status}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-white/10" />
                  {activeOverlay.memberCard.daysRemaining !== undefined && (
                    <>
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase">Remaining</span>
                        <span className="font-bold text-emerald-300">
                          {activeOverlay.memberCard.daysRemaining} Days
                        </span>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                    </>
                  )}
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Valid Until</span>
                    <span className="font-bold text-white">
                      {activeOverlay.memberCard.expiryDate}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom Progress Countdown */}
            <div className="w-full max-w-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono opacity-70">
                <span>Auto-resetting display...</span>
                <span>{Math.ceil((countdownPercent / 100) * 3.8)}s</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${countdownPercent}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
