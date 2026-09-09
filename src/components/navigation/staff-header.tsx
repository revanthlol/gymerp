"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { Terminal, QrCode, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StaffHeader({
  gymName,
  userEmail,
}: {
  gymName: string;
  userEmail: string;
}) {
  const { logout } = useAuth();

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 glow-bar">
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
          <Button asChild size="sm" className="h-8 gap-1.5 glow-bottom">
            <Link href="/staff/kiosk">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Launch Kiosk</span>
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            title="Sign Out"
            className="h-8 gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
