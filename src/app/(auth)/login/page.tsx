"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { Shield, Building2, Terminal, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@ironpulse.local");
  const [password, setPassword] = useState("Admin12345!");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<"platform" | "admin" | "staff">("admin");
  const router = useRouter();

  const handleRoleSelect = (role: "platform" | "admin" | "staff") => {
    setSelectedRole(role);
    setError(null);
    if (role === "platform") {
      setEmail("platform@gymerp.local");
      setPassword("Admin12345!");
    } else if (role === "admin") {
      setEmail("admin@ironpulse.local");
      setPassword("Admin12345!");
    } else {
      setEmail("staff@ironpulse.local");
      setPassword("Staff12345!");
    }
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

      // 3. Route to role destination
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
      setError(err.message || "Invalid credentials or login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#080809] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,94,30,0.15),rgba(255,255,255,0))]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 text-orange-500 shadow-[0_0_24px_rgba(255,94,30,0.2)]">
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 16.5a3.5 3.5 0 0 0 5 0l5-5a3.5 3.5 0 0 0 0-5l-1-1a3.5 3.5 0 0 0-5 0l-5 5a3.5 3.5 0 0 0 0 5z" />
              <path d="m14 14 2.5 2.5" />
              <path d="m7.5 7.5 2.5 2.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">GymERP</h1>
          <p className="text-sm text-zinc-400">Enterprise Gym & Fitness Operational Portal</p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6">
          {/* Quick Demo Switcher */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Quick Role Preset
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleSelect("platform")}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  selectedRole === "platform"
                    ? "bg-purple-950/40 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                    : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Superadmin</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("admin")}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  selectedRole === "admin"
                    ? "bg-orange-950/40 border-orange-500/50 text-orange-300 shadow-[0_0_12px_rgba(255,94,30,0.2)]"
                    : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                <Building2 className="w-4 h-4 text-orange-400" />
                <span>Gym Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("staff")}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  selectedRole === "staff"
                    ? "bg-blue-950/40 border-blue-500/50 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                    : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                <Terminal className="w-4 h-4 text-blue-400" />
                <span>Front Staff</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                placeholder="name@gymerp.local"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 pr-10 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold shadow-[0_0_20px_rgba(255,94,30,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>
        </div>

        {/* Security badge footer */}
        <div className="text-center text-xs text-zinc-600 flex items-center justify-center gap-1.5 font-mono">
          <Shield className="w-3.5 h-3.5 text-zinc-500" />
          <span>PostgreSQL Row-Level Security Enforced</span>
        </div>
      </div>
    </div>
  );
}
