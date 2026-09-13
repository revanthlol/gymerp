"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PlatformNav({ userEmail }: { userEmail: string }) {
  const { logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-3 sm:top-4 left-3 right-3 sm:left-6 sm:right-6 lg:left-8 lg:right-8 z-40 h-14 rounded-2xl px-4 sm:px-6 transition-all duration-300 ease-out flex items-center justify-between pointer-events-auto",
        isScrolled
          ? "bg-[#090a0f]/85 backdrop-blur-2xl [backdrop-filter:blur(24px)_saturate(140%)_contrast(105%)] border border-white/[0.12] shadow-2xl shadow-black/50"
          : "bg-[#090a0f]/60 backdrop-blur-xl [backdrop-filter:blur(20px)_saturate(130%)] border border-white/[0.08] shadow-lg shadow-black/20"
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-300 shadow-sm">
          <Shield className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-xs sm:text-sm tracking-tight">GYMERP</span>
          <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
            Platform Fleet
          </span>
        </div>
      </div>

      {/* Global Network Status */}
      <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono text-[11px]">Fleet Status: Operational</span>
      </div>

      {/* User & Logout */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium text-zinc-200">{userEmail}</p>
          <p className="text-[10px] text-purple-400/90 font-mono">Platform Operator</p>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
