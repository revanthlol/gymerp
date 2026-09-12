"use client";

import React from "react";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { AuthImageSlideshow } from "@/components/auth-slideshow";
import { motion } from "framer-motion";

import { useSecretPlatformAccess } from "@/hooks/use-secret-access";

export default function LoginPage() {
  const { handleSecretClick } = useSecretPlatformAccess();

  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-[#090a0f] text-zinc-100">
      {/* Form Column */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col justify-between p-6 sm:p-10 lg:p-12"
      >
        <div className="flex items-center gap-2">
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
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>

        <div className="text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} GymERP. All rights reserved.
        </div>
      </motion.div>

      {/* Editorial Slideshow Column */}
      <AuthImageSlideshow
        tagline="GymERP Command Center"
        description="Unified management for administrators, trainers, and athletes."
      />
    </div>
  );
}
