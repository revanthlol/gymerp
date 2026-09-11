"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Reveal } from "@/components/Reveal";

export default function PlatformLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign in with Firebase client SDK
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // 2. Exchange ID token for secure session cookie
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to establish platform session");
      }

      const role = data.user.role;
      if (role !== "platform") {
        throw new Error("Access Denied: Account lacks platform administrator privileges.");
      }

      router.push("/platform");
      router.refresh();
    } catch (err: any) {
      console.error("Platform login error:", err);
      setError(err.message || "Invalid platform credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#08090a] text-zinc-100">
      <Reveal className="w-full max-w-[420px] space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 group-hover:scale-105 transition-transform mx-auto">
            <Shield className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">Platform Console</h1>
          <p className="text-xs text-zinc-400">
            Global administrative access and tenant fleet management
          </p>
        </div>

        {/* Login Card */}
        <Card className="glass-panel border-white/[0.08] bg-[#0c0d10] rounded-2xl">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-200">
              Superadmin Authentication
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Restricted infrastructure gateway
            </CardDescription>
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
                <label className="text-xs font-medium text-zinc-300">Admin Email</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="platform@gymerp.local"
                  className="bg-[#08090a] border-white/[0.08] text-xs h-10 rounded-xl focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Master Key / Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 bg-[#08090a] border-white/[0.08] text-xs h-10 rounded-xl focus:border-purple-500"
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
                className="w-full h-10 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Access Platform Console</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back Link to Gym Portal */}
        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Return to Gym Portal Login</span>
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
