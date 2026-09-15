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

export default function MemberLoginPage() {
  const router = useRouter();
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
    <div className="grid min-h-svh lg:grid-cols-2 bg-background text-foreground">
      {/* Form Column */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col justify-between p-6 sm:p-10 lg:p-12"
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-medium group">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm transition-transform group-hover:scale-105">
              G
            </div>
            <span className="font-semibold text-foreground tracking-tight text-base">
              GymERP
            </span>
          </Link>

          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
            Member Access
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Member Pass
              </h1>
              <p className="text-sm text-muted-foreground">
                Access your digital gym pass and membership status
              </p>
            </div>

            {/* Seamless Method Selector Tabs */}
            <div className="grid grid-cols-2 p-1 bg-muted border border-border rounded-lg relative">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("phone");
                  setErrorMsg(null);
                }}
                className={`relative flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  loginMethod === "phone" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {loginMethod === "phone" && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-card rounded-md shadow-sm border border-border"
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
                  loginMethod === "email" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {loginMethod === "email" && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-card rounded-md shadow-sm border border-border"
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
                  className="h-10 bg-muted/60 border-input text-foreground placeholder:text-muted-foreground rounded-lg focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Enter the contact registered with your gym reception.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-10 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 group"
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

            <div className="pt-2 text-center text-xs text-muted-foreground">
              Gym staff or administrator?{" "}
              <Link
                href="/login"
                className="text-foreground hover:underline underline-offset-4 font-medium"
              >
                Staff sign in &rarr;
              </Link>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
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
