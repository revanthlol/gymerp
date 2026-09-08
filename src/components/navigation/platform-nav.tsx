"use client";

import React from "react";
import { useAuth } from "@/lib/auth/context";
import { Shield, LogOut, Database, Building2, Activity } from "lucide-react";

export function PlatformNav({ userEmail }: { userEmail: string }) {
  const { logout } = useAuth();

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">GymERP</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                Platform Console
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">Global Superadmin Tier</p>
          </div>
        </div>

        {/* Global DB Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>PostgreSQL 16: Active</span>
        </div>

        {/* User & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-zinc-200">{userEmail}</p>
            <p className="text-[10px] text-purple-400 font-mono">platform_superadmin</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
