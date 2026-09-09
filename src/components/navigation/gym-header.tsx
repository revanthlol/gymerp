"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import {
  Home,
  Users,
  Inbox,
  Calendar,
  Settings,
  QrCode,
  HelpCircle,
  Bell,
  LogOut,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GymHeaderProps {
  gymName: string;
  userEmail: string;
}

export function GymHeader({ gymName, userEmail }: GymHeaderProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [supportOpen, setSupportOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/admin", icon: Home },
    { label: "Clients", href: "/admin/members", icon: Users },
    { label: "Inbox", href: "/admin/attendance", icon: Inbox },
    { label: "Scheduling", href: "/admin/plans", icon: Calendar },
    { label: "Kiosk", href: "/staff/kiosk", icon: QrCode },
    { label: "Athlete App", href: "/admin/mobile-preview", icon: Smartphone },
  ];

  const displayName = userEmail.split("@")[0] || "Gym Admin";

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md glow-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left Brand */}
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-full bg-brand text-carbon-950 flex items-center justify-center font-black text-sm tracking-tighter shadow-[0_0_16px_rgba(198,255,0,0.3)] group-hover:scale-105 transition-transform">
                G
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-white text-base tracking-widest leading-none">
                  GRYM
                </span>
                <span className="text-[10px] text-zinc-400 font-mono leading-tight truncate max-w-[120px]">
                  {gymName}
                </span>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "text-brand font-semibold"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-brand" : "text-zinc-400"}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-[-13px] left-3 right-3 h-[2px] bg-brand rounded-full shadow-[0_0_8px_rgba(198,255,0,0.8)]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Secondary Utilities */}
          <div className="flex items-center gap-3">
            {/* Support */}
            <button
              onClick={() => setSupportOpen(true)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-1.5 px-2 rounded-lg hover:bg-zinc-900"
            >
              <HelpCircle className="w-4 h-4 text-zinc-400" />
              <span className="hidden sm:inline">Support</span>
            </button>

            {/* Notifications */}
            <button
              title="Notifications"
              className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand ring-2 ring-zinc-950 animate-pulse" />
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-800">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 border border-slate-600 flex items-center justify-center font-bold text-xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-white capitalize leading-none">
                  {displayName}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono leading-tight">Admin</p>
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

      {/* Support Dialog */}
      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand" />
              <span>GRYM Platform Support</span>
            </DialogTitle>
            <DialogDescription>
              Direct assistance for gym owners, turnstile operations, and POS billing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-zinc-300">
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <p className="font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Kiosk Terminal Diagnostics</span>
              </p>
              <p className="text-zinc-400 text-[11px]">
                Camera scanning requires HTTPS in production or localhost in development.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <p className="font-semibold text-white">Partition Isolation (Postgres RLS)</p>
              <p className="text-zinc-400 text-[11px]">
                Your tenant data is strictly isolated to <strong className="text-white">{gymName}</strong>. Zero athlete records leak across gyms.
              </p>
            </div>

            <Button
              className="w-full mt-2"
              onClick={() => setSupportOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
