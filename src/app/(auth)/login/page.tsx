"use client";

import React from "react";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-[#090a0f] text-zinc-100">
      {/* Form Column */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-12">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2.5 font-medium group">
            <div className="flex size-7 items-center justify-center rounded-lg bg-white text-zinc-950 font-bold text-sm">
              G
            </div>
            <span className="font-semibold text-white tracking-tight text-base">
              GymERP
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>

        <div className="text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} GymERP. All rights reserved.
        </div>
      </div>

      {/* Editorial Visual Column (shadcn login-02) */}
      <div className="relative hidden lg:block bg-zinc-950 border-l border-zinc-900 overflow-hidden">
        <img
          src="/gym-login.jpg"
          alt="Gym Space"
          className="absolute inset-0 h-full w-full object-cover brightness-[0.7] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/20 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 z-10">
          <blockquote className="space-y-1">
            <p className="text-sm font-medium text-zinc-200">
              GymERP Operations
            </p>
            <p className="text-xs text-zinc-400">
              Facility management, member check-ins, and performance tracking.
            </p>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
