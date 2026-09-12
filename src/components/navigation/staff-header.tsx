"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { LayoutDashboard, QrCode, LogOut, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StaffHeader({
  gymName,
  userEmail,
}: {
  gymName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const displayName = userEmail.split("@")[0] || "Staff";

  const navItems = [
    { label: "Front Desk", href: "/staff", icon: LayoutDashboard },
    { label: "Check-In Kiosk", href: "/staff/kiosk", icon: QrCode },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#08090a]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Brand */}
        <div className="flex items-center gap-6">
          <Link href="/staff" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-brand text-carbon-950 flex items-center justify-center font-black text-sm tracking-tighter shadow-[0_0_12px_rgba(62,207,142,0.25)] group-hover:scale-105 transition-transform">
              G
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-base tracking-widest leading-none">
                GYMERP
              </span>
              <span className="text-[10px] text-zinc-400 font-mono leading-tight truncate max-w-[120px]">
                {gymName}
              </span>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "text-brand font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-brand" : "text-zinc-400"}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-[-13px] left-3 right-3 h-[2px] bg-brand rounded-full shadow-[0_0_8px_rgba(62,207,142,0.5)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Status & User Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Kiosks Connected</span>
          </div>

          <div className="flex items-center gap-2.5 pl-2 border-l border-white/[0.06]">
            <div className="w-8 h-8 rounded-full bg-[#0f1013] text-zinc-200 border border-white/[0.08] flex items-center justify-center font-bold text-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-white capitalize leading-none">
                {displayName}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono leading-tight">Staff</p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Sign Out"
              className="h-8 w-8 text-zinc-400 hover:text-white shrink-0 ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
