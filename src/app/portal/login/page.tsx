"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Smartphone,
  QrCode,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Dumbbell,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { memberLoginAction } from "@/lib/api/member-portal";

export default function MemberLoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [identifier, setIdentifier] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim()) {
      setErrorMsg("Please enter your phone number or email");
      return;
    }

    startTransition(async () => {
      const res = await memberLoginAction({ identifier });
      if (!res.success) {
        setErrorMsg(res.message || "Failed to log in");
      } else {
        router.push("/portal");
        router.refresh();
      }
    });
  };



  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#08090a] text-zinc-100 relative overflow-hidden">
      {/* Ambient Multi-Layer Gaussian Blur Glow */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-brand/20 via-emerald-500/15 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-gradient-to-bl from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px] space-y-6 relative z-10"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-primary text-[#08090a] flex items-center justify-center font-black text-lg shadow-[0_0_16px_rgba(62,207,142,0.3)] group-hover:scale-105 transition-transform">
              G
            </div>
            <span className="font-bold text-white text-xl tracking-tight">GYMERP</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Member Portal</h1>
          <p className="text-xs text-zinc-400">
            Access your digital gym pass, active subscription, and workout streaks.
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] bg-[#0c0d10] shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <QrCode className="w-4 h-4 text-brand" />
              <span>Digital Pass Verification</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
              SECURE
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
                Mobile Number or Email
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  required
                  placeholder="+1 (555) 234-5678 or email..."
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10 bg-[#08090a] border-white/[0.08] rounded-xl text-sm text-white focus:border-brand/60 focus:ring-brand/30"
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                Use the contact info registered during gym onboarding.
              </p>
            </div>



            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-primary hover:bg-primary-deep text-[#08090a] font-bold py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isPending ? (
                <span>Verifying Member...</span>
              ) : (
                <>
                  <span>Open Member Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Bottom Link to Staff/Admin */}
          <div className="pt-3 border-t border-zinc-800/60 text-center">
            <Link
              href="/login"
              className="text-xs text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span>Gym Staff or Admin?</span>
              <span className="text-brand font-semibold underline underline-offset-2">
                Sign in here
              </span>
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-zinc-500 font-mono">
          <div className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-900">
            <QrCode className="w-4 h-4 mx-auto mb-1 text-brand opacity-80" />
            <span>Digital Pass</span>
          </div>
          <div className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-900">
            <Dumbbell className="w-4 h-4 mx-auto mb-1 text-emerald-400 opacity-80" />
            <span>Workout Log</span>
          </div>
          <div className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-900">
            <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-sky-400 opacity-80" />
            <span>Pass Status</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
