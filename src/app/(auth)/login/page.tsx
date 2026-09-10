"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Reveal } from "@/components/Reveal";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@ironpulse.local");
  const [password, setPassword] = useState("Admin12345!");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handlePresetSelect = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign in with Firebase client SDK
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
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

      // 3. Route based on verified role
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
      setError(err.message || "Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#080809] text-zinc-100 relative overflow-hidden">
      {/* Atmospheric Gaussian Blur Glow Orbs */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-brand/20 via-emerald-500/15 to-transparent rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-gradient-to-bl from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <Reveal className="w-full max-w-[420px] space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand text-black flex items-center justify-center font-black text-base shadow-[0_0_16px_rgba(118,185,0,0.35)]">
              G
            </div>
            <span className="font-extrabold text-white text-xl tracking-widest">GRYM</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Gym Operations Portal</h1>
          <p className="text-xs text-zinc-400">
            Sign in to manage memberships, athletes, and turnstiles
          </p>
        </div>

        {/* Portal Login Card */}
        <Card className="glass-panel border-zinc-800/80 rounded-2xl shadow-2xl">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-zinc-200">Account Access</CardTitle>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => handlePresetSelect("admin@ironpulse.local", "Admin12345!")}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    email === "admin@ironpulse.local"
                      ? "bg-zinc-800 text-brand font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect("staff@ironpulse.local", "Staff12345!")}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    email === "staff@ironpulse.local"
                      ? "bg-zinc-800 text-brand font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Staff
                </button>
              </div>
            </div>
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
                <label className="text-xs font-medium text-zinc-300">Email Address</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ironpulse.local"
                  className="bg-zinc-900/70 border-zinc-800 text-xs h-10 rounded-xl focus:border-brand"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">Password</label>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 bg-zinc-900/70 border-zinc-800 text-xs h-10 rounded-xl focus:border-brand"
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
                disabled={loading}
                className="w-full h-10 bg-brand text-carbon-950 font-bold hover:bg-brand/90 rounded-xl transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Discrete Platform Superadmin Link */}
        <div className="text-center pt-2">
          <Link
            href="/platform/login"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <span>Platform Administrator? Console Login</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
