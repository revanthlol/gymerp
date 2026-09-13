"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, RefreshCw, Smartphone, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface KioskQrDisplayProps {
  qrDataUrl: string;
  remainingSeconds: number;
  totalSeconds?: number;
  onRefresh: () => void | Promise<void>;
  refreshing: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function KioskQrDisplay({
  qrDataUrl,
  remainingSeconds,
  totalSeconds = 20,
  onRefresh,
  refreshing,
  title = "Scan Pass to Enter or Exit",
  subtitle = "Open your phone camera • Point at the QR code below • Attendance recorded",
  className,
}: KioskQrDisplayProps) {
  const percent = Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));

  return (
    <div className={cn("w-full max-w-md mx-auto flex flex-col items-center text-center space-y-5", className)}>
      {/* Title & Guidance */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 font-normal max-w-sm mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Redesigned QR Mat: Single dark outer card (rounded-2xl) with white inset (rounded-xl) */}
      <motion.div
        animate={{
          borderColor: refreshing ? "rgba(62, 207, 142, 0.8)" : "rgba(255, 255, 255, 0.08)",
          boxShadow: refreshing
            ? "0 0 24px rgba(62, 207, 142, 0.2)"
            : "0 16px 40px rgba(0, 0, 0, 0.6)",
        }}
        transition={{ duration: 0.3 }}
        className="w-full bg-[#0c0d10] border border-white/[0.08] rounded-2xl p-5 sm:p-7 flex flex-col items-center justify-center space-y-4 shadow-xl"
      >
        {/* Inset White QR Code Container (rounded-xl) */}
        <div className="relative p-4 sm:p-5 bg-white rounded-xl shadow-md flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={qrDataUrl}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center justify-center"
            >
              <img
                src={qrDataUrl}
                alt="Dynamic Gym Attendance QR"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain select-none"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Rotation Countdown Bar & Timer */}
        <div className="w-full space-y-2 max-w-xs">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Rotates in:</span>
            </div>
            <span className="font-bold text-primary">{remainingSeconds}s</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              style={{ width: `${percent}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>

          {/* Refresh Action */}
          <div className="flex items-center justify-center pt-1">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 py-1"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-primary")} />
              <span>Rotate Code Now</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
