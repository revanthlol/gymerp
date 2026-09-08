"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { Terminal, QrCode, LogOut, Users, Building2 } from "lucide-react";

export function StaffHeader({
  gymName,
  userEmail,
}: {
  gymName: string;
  userEmail: string;
}) {
  const { logout } = useAuth();

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Gym */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{gymName}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                Front-Desk
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">Shift Active · {userEmail}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/staff/kiosk"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-semibold shadow-[0_0_16px_rgba(255,94,30,0.25)] transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Launch Kiosk</span>
          </Link>

          <button
            onClick={logout}
            title="Sign Out"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
