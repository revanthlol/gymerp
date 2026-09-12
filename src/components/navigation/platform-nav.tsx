"use client";

import React from "react";
import { useAuth } from "@/lib/auth/context";
import { Shield, LogOut, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlatformNav({ userEmail }: { userEmail: string }) {
  const { logout } = useAuth();

  return (
    <header className="border-b border-white/[0.08] bg-[#08090a]/80 backdrop-blur-2xl sticky top-0 z-40 shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_-1px_0_rgba(255,255,255,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">GymERP</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                Platform Console
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">Global Administration</p>
          </div>
        </div>

        {/* Global Network Status */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Operational</span>
        </div>

        {/* User & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-zinc-200">{userEmail}</p>
            <p className="text-[10px] text-purple-400 font-mono">Platform Administrator</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="flex items-center gap-1.5 h-8 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
