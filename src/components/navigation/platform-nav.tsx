"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "@/components/theme-toggle";

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
          ? "bg-white/55 dark:bg-black/55 backdrop-blur-2xl [backdrop-filter:blur(24px)_saturate(160%)_contrast(105%)] border border-zinc-200/80 dark:border-white/[0.14] shadow-[0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.25)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
          : "bg-white/40 dark:bg-black/40 backdrop-blur-2xl [backdrop-filter:blur(20px)_saturate(150%)] border border-zinc-200/70 dark:border-white/[0.1] shadow-[0_8px_30px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.2)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-300 shadow-sm">
          <Shield className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground text-xs sm:text-sm tracking-tight">GYMERP</span>
          <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 font-medium">
            Platform Fleet
          </span>
        </div>
      </div>

      {/* Global Network Status */}
      <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-mono text-[11px]">Fleet Status: Operational</span>
      </div>

      {/* User, Theme & Logout */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium text-foreground">{userEmail}</p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">Platform Operator</p>
        </div>
        <ThemeToggle />
        <button
          onClick={logout}
          title="Sign out"
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
