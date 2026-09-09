"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import {
  LayoutDashboard,
  Users,
  QrCode,
  Sliders,
  LogOut,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  gymName: string;
  userEmail: string;
}

export function AdminSidebar({ gymName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Members", href: "/admin/members", icon: Users },
    { label: "Plans", href: "/admin/plans", icon: Sliders },
    { label: "Check-in Kiosk", href: "/staff/kiosk", icon: QrCode },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex flex-col justify-between shrink-0 h-screen sticky top-0">
      {/* Top Brand with glow-bar */}
      <div className="p-5 space-y-6 glow-bar pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-[0_0_16px_rgba(255,94,30,0.15)]">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h2 className="font-bold text-white text-sm truncate">{gymName}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-zinc-400 font-mono">Admin Tier</span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-orange-400" : "text-zinc-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-medium text-zinc-200 truncate">{userEmail}</p>
            <p className="text-[10px] text-orange-400 font-mono">gym_admin</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            title="Sign Out"
            className="h-8 w-8 text-zinc-400 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
