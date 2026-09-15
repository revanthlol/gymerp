"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutConfirmModal } from "@/components/auth/sign-out-confirm-modal";

export function PlatformNav({ userEmail }: { userEmail: string }) {
  const { logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-3 sm:top-4 left-3 right-3 sm:left-6 sm:right-6 lg:left-8 lg:right-8 z-40 h-14 rounded-2xl px-4 sm:px-6 transition-all duration-300 ease-out flex items-center justify-between pointer-events-auto",
          isScrolled
            ? "bg-white/70 dark:bg-black/55 backdrop-blur-2xl [backdrop-filter:blur(24px)_saturate(160%)] border border-stone-200/80 dark:border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.06),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
            : "bg-white/50 dark:bg-black/40 backdrop-blur-2xl [backdrop-filter:blur(20px)_saturate(150%)] border border-stone-200/70 dark:border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.4)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-xs sm:text-sm tracking-tight">GYMERP</span>
            <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 font-medium">
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
            <p className="text-[10px] text-muted-foreground font-mono">Platform Operator</p>
          </div>
          <ThemeToggle />
          <button
            onClick={() => setSignOutOpen(true)}
            type="button"
            title="Sign out"
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <SignOutConfirmModal
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        onConfirm={logout}
        title="Sign Out of Platform Console"
        description="Are you sure you want to end your platform operator session?"
      />
    </>
  );
}
