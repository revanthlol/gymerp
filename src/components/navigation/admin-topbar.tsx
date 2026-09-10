"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminTopBarProps {
  gymName: string;
}

const PAGE_LABELS: Record<string, string> = {
  "/admin":              "Dashboard",
  "/admin/members":      "Members",
  "/admin/attendance":   "Attendance",
  "/admin/classes":      "Group Classes",
  "/admin/plans":        "Membership Plans",
  "/admin/payments":     "Payments",
  "/admin/analytics":    "Analytics",
  "/staff/kiosk":        "Check-In Kiosk",
};

export function AdminTopBar({ gymName }: AdminTopBarProps) {
  const pathname = usePathname();

  // Find the best matching label
  const pageLabel = Object.entries(PAGE_LABELS)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([key]) => pathname === key || pathname.startsWith(key + "/"))?.[1]
    ?? pathname.split("/").pop()?.replace(/-/g, " ").replace(/^\w/, c => c.toUpperCase())
    ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.05] bg-[#080809]/90 backdrop-blur-xl px-4 lg:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        <span className="text-zinc-500 font-medium hidden sm:inline">GRYM</span>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 hidden sm:inline" />
        <span className="font-semibold text-white">{pageLabel}</span>
      </nav>

      {/* Right utilities */}
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden sm:inline text-xs text-zinc-500 font-medium">{gymName}</span>

        <div className="h-4 w-px bg-white/10" />

        {/* Notification bell */}
        <button
          title="Notifications"
          className="relative p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand ring-1 ring-[#080809] animate-pulse" />
        </button>
      </div>
    </header>
  );
}
