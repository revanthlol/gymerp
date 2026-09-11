"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Inbox,
  Dumbbell,
  Sliders,
  CreditCard,
  BarChart3,
  QrCode,
  LogOut,
  Menu,
  Pin,
  PinOff,
  Bell,
  ChevronRight,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  gymName: string;
  userEmail: string;
  children: React.ReactNode;
}

const navItems = [
  { title: "Dashboard",   href: "/admin",            icon: LayoutDashboard },
  { title: "Members",     href: "/admin/members",     icon: Users },
  { title: "Attendance",  href: "/admin/attendance",  icon: Inbox },
  { title: "Classes",     href: "/admin/classes",     icon: Dumbbell },
  { title: "Plans",       href: "/admin/plans",       icon: Sliders },
  { title: "Payments",    href: "/admin/payments",    icon: CreditCard },
  { title: "Analytics",   href: "/admin/analytics",   icon: BarChart3 },
  { title: "Check-in Kiosk", href: "/admin/kiosk",    icon: QrCode, badge: "Live" },
];

const PAGE_LABELS: Record<string, string> = {
  "/admin":            "Dashboard",
  "/admin/members":    "Members & Athletes",
  "/admin/attendance": "Live Attendance",
  "/admin/classes":    "Group Classes",
  "/admin/plans":      "Membership Plans",
  "/admin/payments":   "Financial Ledger",
  "/admin/analytics":  "Performance Reports",
  "/admin/kiosk":      "Check-In Terminal",
  "/staff/kiosk":      "Check-In Terminal",
};

export function DashboardShell({ gymName, userEmail, children }: DashboardShellProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const [isPinned, setIsPinned] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("gymerp_sidebar_pinned");
    return saved === null ? true : saved === "true";
  });
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const pillTouchStartX = useRef(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      localStorage.setItem("gymerp_sidebar_pinned", String(next));
      return next;
    });
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const displayName = userEmail.split("@")[0] || "admin";
  const initials = displayName.slice(0, 2).toUpperCase();

  // Desktop width state
  const isExpanded = isMobile ? true : (isPinned || isSidebarHovered);

  const currentPageLabel =
    PAGE_LABELS[pathname] ||
    Object.entries(PAGE_LABELS).find(([key]) => pathname.startsWith(key) && key !== "/admin")?.[1] ||
    "Dashboard";

  return (
    <div className="min-h-screen bg-[#171717] text-zinc-100 flex relative overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      {/* 1. Desktop Sidebar */}
      {!isMobile && (
        <aside
          onMouseEnter={() => {
            if (!isPinned) setIsSidebarHovered(true);
          }}
          onMouseLeave={() => {
            if (!isPinned) setIsSidebarHovered(false);
          }}
          className={cn(
            "fixed left-0 top-0 z-40 h-full shrink-0 border-r border-white/[0.08] bg-[#1c1c1c]/95 backdrop-blur-xl transition-[width] duration-250 ease-out flex flex-col justify-between select-none shadow-[4px_0_24px_rgba(0,0,0,0.35)]",
            isExpanded ? "w-64" : "w-16"
          )}
        >
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] px-3.5">
            <Link href="/admin" className="flex items-center gap-3 overflow-hidden group">
              <div className="w-8 h-8 rounded-sm bg-primary text-[#171717] flex items-center justify-center font-bold text-sm tracking-tight shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                G
              </div>
              {isExpanded && (
                <div className="flex flex-col overflow-hidden animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white text-sm tracking-tight leading-none">
                      GYMERP
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                      Studio
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[130px] mt-0.5">
                    {gymName}
                  </span>
                </div>
              )}
            </Link>

            {isExpanded && (
              <button
                onClick={togglePin}
                title={isPinned ? "Unpin sidebar (collapse to icons)" : "Pin sidebar"}
                className="p-1 rounded-sm text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
              >
                {isPinned ? <Pin className="w-3.5 h-3.5 text-primary" /> : <PinOff className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Nav List */}
          <div className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!isExpanded ? item.title : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-sm transition-all duration-150 relative text-xs font-medium",
                    isExpanded ? "px-3 py-2 h-9" : "justify-center h-10 w-10 mx-auto",
                    isActive
                      ? "bg-white/[0.08] text-white font-semibold border border-white/[0.08]"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-sm shadow-[0_0_8px_rgba(62,207,142,0.8)]" />
                  )}

                  <item.icon
                    className={cn(
                      "shrink-0 transition-colors",
                      isExpanded ? "w-4 h-4" : "w-5 h-5",
                      isActive ? "text-primary" : "text-zinc-400"
                    )}
                  />

                  {isExpanded && (
                    <div className="flex items-center justify-between flex-1 overflow-hidden">
                      <span className="truncate">{item.title}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase rounded bg-primary/10 text-primary border border-primary/20">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.08] p-2 space-y-1 bg-[#1c1c1c]">
            {isExpanded ? (
              <div className="flex items-center justify-between px-2 py-1.5 rounded-sm bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-7 h-7 rounded-sm bg-[#242424] border border-white/[0.1] text-zinc-200 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                    {initials}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-xs font-medium text-zinc-200 leading-tight">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono leading-none">
                      Administrator
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-1.5 rounded-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={logout}
                title="Sign out"
                className="w-10 h-10 mx-auto flex items-center justify-center rounded-sm text-zinc-400 hover:text-red-400 hover:bg-white/[0.04] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </aside>
      )}

      {/* 2. Mobile Drawer */}
      {isMobile && (
        <>
          {isMobileOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsMobileOpen(false)}
            />
          )}

          <div
            className={cn(
              "fixed left-0 top-0 z-50 h-full w-64 bg-[#1c1c1c] border-r border-white/[0.08] flex flex-col justify-between transition-transform duration-250 ease-out",
              isMobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {/* Mobile Header */}
            <div className="flex h-14 items-center justify-between border-b border-white/[0.08] px-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-sm bg-primary text-[#171717] flex items-center justify-center font-bold text-xs">
                  G
                </div>
                <span className="font-semibold text-sm text-white">GYMERP</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Footer */}
            <div className="p-3 border-t border-white/[0.08] flex items-center justify-between">
              <span className="text-xs text-zinc-400 truncate">{userEmail}</span>
              <button
                onClick={logout}
                className="text-xs text-red-400 hover:underline flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile Edge Swipe Pill */}
          {!isMobileOpen && (
            <div
              onTouchStart={(e) => {
                pillTouchStartX.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                const dx = e.changedTouches[0].clientX - pillTouchStartX.current;
                if (dx > 30) setIsMobileOpen(true);
              }}
              onClick={() => setIsMobileOpen(true)}
              className="fixed left-0 top-1/2 -translate-y-1/2 z-40 w-3 h-32 rounded-r bg-white/10 hover:bg-primary/40 cursor-pointer flex items-center justify-center transition-colors"
              title="Open Navigation"
            >
              <div className="w-0.5 h-6 rounded-full bg-white/30" />
            </div>
          )}
        </>
      )}

      {/* 3. Main Content Container */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-[padding] duration-250 ease-out",
          isMobile ? "pl-0" : isPinned ? "pl-64" : "pl-16"
        )}
      >
        {/* Sticky Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#171717]/90 backdrop-blur-xl px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setIsMobileOpen(true)}
                className="p-1.5 rounded-sm bg-white/[0.05] border border-white/[0.08] text-zinc-300"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            {/* Breadcrumb Hierarchy */}
            <nav className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 font-medium">GYMERP</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              <span className="font-semibold text-white tracking-tight">{currentPageLabel}</span>
            </nav>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-zinc-500 font-mono font-medium">
              {gymName}
            </span>

            <div className="h-4 w-px bg-white/[0.08] hidden sm:block" />

            <Link
              href="/admin/kiosk"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-mono font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.08] hover:border-primary/40 hover:text-primary transition-all"
            >
              <QrCode className="w-3.5 h-3.5 text-primary" />
              <span>Kiosk</span>
            </Link>

            <button
              title="Notifications"
              className="relative p-1.5 rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary ring-1 ring-[#171717]" />
            </button>
          </div>
        </header>

        {/* Page Main Content with Snappy Native-feel Entrance */}
        <main
          key={pathname}
          className="flex-1 min-w-0 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in-50 duration-200"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
