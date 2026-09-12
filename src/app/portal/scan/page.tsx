"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Dumbbell,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Phone,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { memberSelfScanKioskAction } from "@/lib/api/attendance";
import { playSuccessChime, playDeniedBuzz } from "@/lib/kiosk/audio";

function ScanProcessor() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawToken = searchParams.get("token") || "";
  const requestedMode = (searchParams.get("mode") as "entry" | "exit" | "auto") || "entry";

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    expired?: boolean;
    memberName?: string;
    memberCard?: {
      id: string;
      fullName: string;
      phone: string;
      joinDate: string;
      expiryDate: string;
      status: string;
    };
    mode?: "entry" | "exit";
    message: string;
    checkedInAt?: Date | string;
    duplicate?: boolean;
    requirePhone?: boolean;
  } | null>(null);

  // Auto-attempt scan if saved phone exists in localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedPhone = localStorage.getItem("gymerp_athlete_phone");
    if (savedPhone) {
      setPhone(savedPhone);
      executeScan(savedPhone);
    }
  }, [rawToken]);

  const executeScan = async (athletePhone: string) => {
    if (!rawToken) {
      setResult({
        success: false,
        message: "No check-in QR token detected in link. Please scan the kiosk screen again.",
      });
      return;
    }

    setLoading(true);
    try {
      const res: any = await memberSelfScanKioskAction({
        qrToken: rawToken,
        memberPhone: athletePhone,
        overrideMode: requestedMode,
      });

      if (res.success) {
        playSuccessChime();
        if (athletePhone) {
          localStorage.setItem("gymerp_athlete_phone", athletePhone);
        }
        setResult({
          success: true,
          memberName: res.memberName,
          memberCard: res.memberCard,
          mode: res.mode,
          message: res.message,
          checkedInAt: res.checkedInAt,
        });
      } else if (res.expired) {
        playDeniedBuzz();
        setResult({
          success: false,
          expired: true,
          memberCard: res.memberCard,
          message: res.message || "Membership expired. Please see front desk.",
        });
      } else {
        playDeniedBuzz();
        setResult({
          success: false,
          duplicate: res.duplicate,
          requirePhone: res.requirePhone,
          message: res.message,
        });
      }
    } catch {
      playDeniedBuzz();
      setResult({
        success: false,
        message: "Failed to connect to gym check-in terminal. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    executeScan(phone.trim());
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#08090a] text-zinc-100 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm space-y-6 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-[#08090a] flex items-center justify-center font-black text-sm">
              G
            </div>
            <span className="font-bold text-white text-lg tracking-tight">GYMERP SCAN</span>
          </div>
          <p className="text-xs text-zinc-400">
            {requestedMode === "exit" ? "Gym Exit Scanner" : "Front-Desk Check-in Kiosk"}
          </p>
        </div>

        {/* Processing State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 rounded-2xl border border-white/[0.08] text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
              <Spinner size="lg" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-white">Validating Check-in Pass</h2>
              <p className="text-xs text-zinc-400">Verifying your active membership pass...</p>
            </div>
          </motion.div>
        )}

        {/* Expired Pass State (Aesthetic Dark Red Card) */}
        {!loading && result && result.expired && result.memberCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl border border-red-500/40 bg-gradient-to-b from-red-950/30 to-[#08090a] text-center space-y-5 shadow-[0_0_35px_rgba(239,68,68,0.15)]"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                Membership Expired
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {result.memberCard.fullName}
              </h2>
              <p className="text-xs text-red-300 font-medium pt-1">{result.message}</p>
            </div>

            {/* Pass Metadata Card */}
            <div className="grid grid-cols-2 gap-2.5 text-left p-3.5 rounded-xl bg-[#08090a]/90 border border-white/[0.08] text-xs font-mono">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Pass ID</span>
                <span className="text-zinc-200 font-bold">#{result.memberCard.id.slice(0, 8)}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Status</span>
                <span className="text-red-400 font-bold uppercase">Expired</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Joined</span>
                <span className="text-zinc-400">{result.memberCard.joinDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Expired On</span>
                <span className="text-red-400 font-bold">{result.memberCard.expiryDate}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/portal/login">
                <Button className="w-full h-10 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2">
                  <span>Sign into Member Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Success State */}
        {!loading && result && result.success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`glass-panel p-8 rounded-2xl border text-center space-y-5 shadow-2xl ${
              result.mode === "exit"
                ? "border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent"
                : "border-primary/30 bg-gradient-to-b from-primary/5 to-transparent"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg ${
                result.mode === "exit"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-primary/20 text-primary border border-primary/40"
              }`}
            >
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium mb-1 bg-white/[0.04] border border-white/[0.08]">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>{result.mode === "exit" ? "Exit Logged" : "Access Granted"}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {result.memberName || "Athlete"}
              </h2>
              <p className="text-xs text-zinc-300 pt-1">{result.message}</p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-zinc-400 flex items-center justify-between">
              <span>Time Verified:</span>
              <span className="text-white">
                {new Date(result.checkedInAt || Date.now()).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>

            <div className="pt-2">
              <Link href="/portal">
                <Button className="w-full h-10 bg-primary hover:bg-primary-deep text-[#08090a] font-semibold text-xs rounded-lg flex items-center justify-center gap-2">
                  <span>Open Member Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Failure / Phone Required Prompt */}
        {!loading && (!result || (!result.success && !result.expired)) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-6 rounded-2xl border border-white/[0.08] space-y-4"
          >
            {result && !result.success && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Scan Unsuccessful</p>
                  <p className="mt-0.5 text-zinc-300">{result.message}</p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>Verify Your Athlete Mobile</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Enter the phone number registered with your gym membership.
              </p>
            </div>

            <form onSubmit={handleSubmitPhone} className="space-y-3">
              <Input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 555-0199 or 10 digits"
                className="bg-[#0c0d10] border-white/[0.08] text-xs h-10 rounded-lg focus:border-primary text-zinc-100 font-mono"
              />

              <Button
                type="submit"
                disabled={loading || !phone.trim()}
                className="w-full h-10 bg-primary hover:bg-primary-deep text-[#08090a] font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5"
              >
                <span>Confirm Check-In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </form>

            <div className="pt-2 text-center">
              <Link
                href="/portal/login"
                className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in with full Member Account</span>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function KioskScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08090a] flex items-center justify-center text-xs text-zinc-400 gap-2">
          <Spinner size="sm" />
          <span>Loading check-in camera...</span>
        </div>
      }
    >
      <ScanProcessor />
    </Suspense>
  );
}
