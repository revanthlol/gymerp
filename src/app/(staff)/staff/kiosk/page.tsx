"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wifi,
  Sparkles,
  Camera,
} from "lucide-react";

export default function KioskPage() {
  const [scanResult, setScanResult] = useState<{
    status: "SUCCESS" | "EXPIRED" | "DUPLICATE" | "NOT_FOUND";
    memberName?: string;
    message: string;
    timestamp: string;
  } | null>(null);

  const [simulating, setSimulating] = useState(false);

  const simulateScan = (status: "SUCCESS" | "EXPIRED" | "DUPLICATE") => {
    setSimulating(true);
    setScanResult(null);

    setTimeout(() => {
      setSimulating(false);
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      if (status === "SUCCESS") {
        setScanResult({
          status: "SUCCESS",
          memberName: "Rohan Varma",
          message: "Access Granted · Annual VIP Pass",
          timestamp: time,
        });
      } else if (status === "EXPIRED") {
        setScanResult({
          status: "EXPIRED",
          memberName: "Priya Nair",
          message: "Membership Expired · Please renew at counter",
          timestamp: time,
        });
      } else {
        setScanResult({
          status: "DUPLICATE",
          memberName: "Rohan Varma",
          message: "Already Checked In (5m ago) · Anti-Passback Alert",
          timestamp: time,
        });
      }
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/staff"
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Kiosk</span>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-mono">
          <Wifi className="w-3.5 h-3.5 animate-pulse" />
          <span>Terminal Online · Scanner Active</span>
        </div>
      </div>

      {/* Clean Scanner Card without glass/blur overhead */}
      <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-3xl text-center space-y-6 relative overflow-hidden">
        <div>
          <h1 className="text-xl font-bold text-white">Self-Service Check-In Terminal</h1>
          <p className="text-xs text-zinc-400 mt-1">Hold your digital member QR code or card directly before the camera</p>
        </div>

        {/* Viewfinder Reticle with Laser Scanline */}
        <div className="relative w-64 h-64 mx-auto rounded-3xl border-2 border-dashed border-orange-500/40 bg-zinc-950/80 flex items-center justify-center overflow-hidden shadow-[0_0_32px_rgba(255,94,30,0.15)]">
          {/* Corner Guides */}
          <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-orange-500" />
          <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-orange-500" />
          <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-orange-500" />
          <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-orange-500" />

          {/* Animated Laser Scanline */}
          <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_12px_#ff5e1e] animate-laser" />

          {/* Center Graphic */}
          <div className="text-zinc-600 flex flex-col items-center gap-2">
            <Camera className="w-10 h-10 stroke-[1.5]" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">Align QR Code</span>
          </div>
        </div>

        {/* Scan Result Feedback Banner */}
        {scanResult && (
          <div
            className={`p-4 rounded-2xl border text-left transition-all ${
              scanResult.status === "SUCCESS"
                ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-200"
                : scanResult.status === "EXPIRED"
                ? "bg-red-950/50 border-red-500/40 text-red-200"
                : "bg-amber-950/50 border-amber-500/40 text-amber-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {scanResult.status === "SUCCESS" ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : scanResult.status === "EXPIRED" ? (
                <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">{scanResult.memberName}</h2>
                  <span className="text-xs font-mono opacity-70">{scanResult.timestamp}</span>
                </div>
                <p className="text-xs mt-0.5 opacity-90">{scanResult.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Hardware / Test Simulator Buttons */}
        <div className="pt-4 border-t border-zinc-800/80 space-y-2">
          <span className="text-xs font-medium text-zinc-500 uppercase font-mono">
            Hardware Scan Simulator
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => simulateScan("SUCCESS")}
              disabled={simulating}
              className="px-3 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/50 text-emerald-300 text-xs font-medium transition-colors"
            >
              Simulate Valid Member Pass
            </button>
            <button
              onClick={() => simulateScan("EXPIRED")}
              disabled={simulating}
              className="px-3 py-1.5 rounded-xl bg-red-950/50 hover:bg-red-900/50 border border-red-800/50 text-red-300 text-xs font-medium transition-colors"
            >
              Simulate Expired Pass
            </button>
            <button
              onClick={() => simulateScan("DUPLICATE")}
              disabled={simulating}
              className="px-3 py-1.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/50 border border-amber-800/50 text-amber-300 text-xs font-medium transition-colors"
            >
              Simulate Repeat Scan (&lt;10m)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
