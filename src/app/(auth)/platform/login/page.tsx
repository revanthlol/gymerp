"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthImageSlideshow } from "@/components/auth-slideshow";

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
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await userCredential.user.getIdToken();

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
      if (role === "admin") {
        router.push("/admin");
        router.refresh();
        return;
      } else if (role === "staff") {
        router.push("/staff");
        router.refresh();
        return;
      } else if (role !== "platform") {
        throw new Error("Access Denied: This portal is reserved for platform administrators.");
      }

      router.push("/platform");
      router.refresh();
    } catch (err: any) {
      if (err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password" || err?.code === "auth/user-not-found") {
        setError("Invalid email or password.");
      } else {
        setError(err.message || "Invalid platform credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-[#090a0f] text-zinc-100">
      {/* Form Column */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col justify-between p-6 sm:p-10 lg:p-12"
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-medium group">
            <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-800 text-white font-bold text-sm">
              P
            </div>
            <span className="font-semibold text-white tracking-tight text-base">
              Platform Console
            </span>
          </Link>

          <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
            Superadmin
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Platform Sign In
              </h1>
              <p className="text-sm text-zinc-400">
                Administrative access for global infrastructure governance
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-zinc-300">
                  Admin Email
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="platform@gymerp.local"
                  disabled={loading}
                  className="h-10 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus-visible:ring-1 focus-visible:ring-zinc-400"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-zinc-300">
                  Master Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-10 pr-9 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus-visible:ring-1 focus-visible:ring-zinc-400"
                    placeholder="••••••••"
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
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Access Console</span>
                )}
              </Button>
            </form>

            <div className="pt-2 text-center text-xs text-zinc-400">
              <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
                &larr; Return to Staff Login
              </Link>
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} GymERP Platform Infrastructure.
        </div>
      </motion.div>

      {/* Editorial Slideshow Column */}
      <AuthImageSlideshow
        tagline="GymERP Infrastructure"
        description="Global platform governance, multi-tenant fleet control, and audit trails."
      />
    </div>
  );
}
