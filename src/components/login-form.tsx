"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
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
      setError("Please enter your email first to reset your password.");
      return;
    }
    setResetLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (err: any) {
      if (err?.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else {
        setError(err.message || "Failed to send password reset email.");
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

      // 3. Dynamic role-based redirection
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
      if (err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else if (err?.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err?.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError(err.message || "Unable to sign in. Please verify your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Sign in to your account
        </h1>
        <p className="text-sm text-zinc-400">
          Enter your email and password to access the workspace
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300">
          {error}
        </div>
      )}

      {resetSent && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300">
          Password reset link sent to {email}.
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-medium text-zinc-300">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="h-10 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus-visible:ring-1 focus-visible:ring-zinc-400"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-medium text-zinc-300">
              Password
            </label>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetLoading || loading}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              {resetLoading ? "Sending..." : "Forgot password?"}
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
              className="h-10 pr-9 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus-visible:ring-1 focus-visible:ring-zinc-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-white text-zinc-950 hover:bg-zinc-200 font-medium rounded-lg transition-colors mt-1"
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
      </div>

      <div className="pt-2 text-center text-xs text-zinc-400">
        Looking for member pass?{" "}
        <Link href="/portal/login" className="text-white hover:underline underline-offset-4 font-medium">
          Member portal &rarr;
        </Link>
      </div>
    </form>
  );
}
