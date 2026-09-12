"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight, QrCode, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/Reveal";

function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your work email first, then click Forgot password.");
      return;
    }
    setResetLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (err?.code === "auth/user-not-found") {
        setError("No gym staff account found with this email address.");
      } else {
        setError(err.message || "Failed to send password reset email. Please verify the email address.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResetSent(false);

    try {
      // 1. Sign in with Firebase client SDK
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await userCredential.user.getIdToken();

      // 2. Exchange ID token for secure HTTP-only session cookie
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to establish session");
      }

      // 3. Dynamic route based on verified role
      const role = data.user.role;
      if (role === "platform") {
        router.push("/platform");
      } else if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/staff");
      }
      router.refresh();
    } catch (err: any) {
      console.error("Login error:", err);
      if (err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password") {
        setError("Invalid email or password. Please verify your credentials or use the reset link below.");
      } else if (err?.code === "auth/user-not-found") {
        setError("No account found with this email. Please check the spelling or ask your gym administrator.");
      } else if (err?.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please wait a moment or reset your password.");
      } else {
        setError(err.message || "Invalid credentials. Please verify your email and password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#08090a] text-zinc-100 relative overflow-hidden">
      {/* Atmospheric Gaussian Blur Glow Orbs */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-primary/15 via-emerald-500/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <Reveal className="w-full max-w-[420px] space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-primary text-[#08090a] flex items-center justify-center font-black text-base shadow-[0_0_16px_rgba(62,207,142,0.3)] group-hover:scale-105 transition-transform">
              G
            </div>
            <span className="font-extrabold text-white text-xl tracking-tight">GYMERP</span>
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">Staff & Management Sign In</h1>
          <p className="text-xs text-zinc-400">
            Unified access for gym administrators, front-desk staff, and trainers.
          </p>
        </div>

        {/* Member Portal Quick Switch Banner */}
        <Link
          href="/portal/login"
          className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-primary/40 hover:bg-white/[0.04] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white group-hover:text-primary transition-colors">
                Gym Athlete or Member?
              </p>
              <p className="text-[11px] text-zinc-400">
                View your digital pass, workout streaks & membership
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Staff/Admin Login Card */}
        <Card className="glass-panel border-white/[0.08] bg-[#0c0d10] rounded-2xl shadow-2xl">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-200">Account Credentials</CardTitle>
            <p className="text-xs text-zinc-500">
              Sign in with your registered gym employee account.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Work Email</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@yourgym.com"
                  className="bg-[#08090a] border-white/[0.08] text-xs h-10 rounded-xl focus:border-primary text-zinc-100"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">Password</label>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="text-[11px] text-zinc-400 hover:text-primary transition-colors underline-offset-2 hover:underline"
                  >
                    {resetLoading ? "Sending link..." : "Forgot password?"}
                  </button>
                </div>
                {resetSent && (
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Password reset link sent to your email. Check your inbox.</span>
                  </div>
                )}
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 bg-[#08090a] border-white/[0.08] text-xs h-10 rounded-xl focus:border-primary text-zinc-100"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full h-10 bg-primary hover:bg-primary-deep text-[#08090a] font-bold rounded-xl transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Verifying role...</span>
                  </>
                ) : (
                  <span>Sign In to Dashboard</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08090a]" />}>
      <LoginForm />
    </Suspense>
  );
}
