"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Phone, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthImageSlideshow } from "@/components/auth-slideshow";
import { memberLoginAction } from "@/lib/api/member-portal";
import { useSecretPlatformAccess } from "@/hooks/use-secret-access";

export default function MemberLoginPage() {
  const router = useRouter();
  const { handleSecretClick } = useSecretPlatformAccess();
  const [isPending, startTransition] = useTransition();
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("phone");
  const [identifier, setIdentifier] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = identifier.trim();
    if (!trimmed) {
      setErrorMsg(
        loginMethod === "phone"
          ? "Please enter your registered phone number"
          : "Please enter your registered email address"
      );
      return;
    }

    startTransition(async () => {
      const res = await memberLoginAction({ identifier: trimmed });
      if (!res.success) {
        setErrorMsg(res.message || "Failed to locate member account");
      } else {
        router.push("/portal");
        router.refresh();
      }
    });
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
          <div
            onClick={handleSecretClick}
            className="flex items-center gap-2.5 font-medium cursor-pointer select-none group"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-white text-zinc-950 font-bold text-sm transition-transform active:scale-95">
              G
            </div>
            <span className="font-semibold text-white tracking-tight text-base">
              GymERP
            </span>
          </div>

          <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
            Member Access
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Member Pass
              </h1>
              <p className="text-sm text-zinc-400">
                Access your digital gym pass and membership status
              </p>
            </div>

            {/* Seamless Method Selector Tabs */}
            <div className="grid grid-cols-2 p-1 bg-zinc-900/80 border border-zinc-800 rounded-lg relative">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("phone");
                  setErrorMsg(null);
                }}
                className={`relative flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  loginMethod === "phone" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {loginMethod === "phone" && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-zinc-800 rounded-md shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                  />
                )}
                <Phone className="size-3.5 relative z-10" />
                <span className="relative z-10">Phone Number</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMethod("email");
                  setErrorMsg(null);
                }}
                className={`relative flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  loginMethod === "email" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {loginMethod === "email" && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-zinc-800 rounded-md shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                  />
                )}
                <Mail className="size-3.5 relative z-10" />
                <span className="relative z-10">Email Address</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300"
                >
                  {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="identifier" className="text-xs font-medium text-zinc-300">
                  {loginMethod === "phone" ? "Mobile Phone" : "Email Address"}
                </label>
                <div className="relative">
                  <Input
                    id="identifier"
                    type={loginMethod === "phone" ? "tel" : "email"}
                    inputMode={loginMethod === "phone" ? "tel" : "email"}
                    autoComplete={loginMethod === "phone" ? "tel" : "email"}
                    required
                    placeholder={
                      loginMethod === "phone" ? "+1 (555) 000-0000" : "member@example.com"
                    }
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={isPending}
                    className="h-10 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus-visible:ring-1 focus-visible:ring-zinc-400"
                  />
                </div>
                <p className="text-[11px] text-zinc-500">
                  Enter the contact registered with your gym reception.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-10 bg-white text-zinc-950 hover:bg-zinc-200 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 group"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Open Pass</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-2 text-center text-xs text-zinc-400">
              Gym staff or administrator?{" "}
              <Link
                href="/login"
                className="text-white hover:underline underline-offset-4 font-medium"
              >
                Staff sign in &rarr;
              </Link>
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} GymERP. All rights reserved.
        </div>
      </motion.div>

      {/* Editorial Slideshow Column */}
      <AuthImageSlideshow
        tagline="GymERP Member Pass"
        description="Instant digital QR pass for turnstiles and class reservations."
      />
    </div>
  );
}
