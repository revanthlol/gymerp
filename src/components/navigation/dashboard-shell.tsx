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
  PanelLeftClose,
  PanelLeft,
  Bell,
  ChevronRight,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

interface DashboardShellProps {
  gymName: string;
  userEmail: string;
  children: React.ReactNode;
}

const adminNavItems = [
  { title: "Dashboard",   href: "/admin",            icon: LayoutDashboard },
  { title: "Members",     href: "/admin/members",     icon: Users },
  { title: "Attendance",  href: "/admin/attendance",  icon: Inbox },
  { title: "Classes",     href: "/admin/classes",     icon: Dumbbell },
  { title: "Plans",       href: "/admin/plans",       icon: Sliders },
  { title: "Payments",    href: "/admin/payments",    icon: CreditCard },
  { title: "Analytics",   href: "/admin/analytics",   icon: BarChart3 },
  { title: "Check-in Kiosk", href: "/admin/kiosk",    icon: QrCode },
];

const staffNavItems = [
  { title: "Front Desk",       href: "/staff",            icon: LayoutDashboard },
  { title: "Member Directory", href: "/staff/members",    icon: Users },
  { title: "Attendance & Floor", href: "/staff/attendance", icon: Inbox },
  { title: "Class Rosters",    href: "/staff/classes",    icon: Dumbbell },
  { title: "Physical Kiosk",   href: "/staff/kiosk",      icon: QrCode },
];

const PAGE_LABELS: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/members": "Members & Athletes",
  "/admin/attendance": "Attendance & Check-ins",
  "/admin/classes": "Classes & Group Scheduling",
  "/admin/plans": "Membership Plans",
  "/admin/payments": "Transactions & Invoices",
  "/admin/analytics": "Facility Analytics",
  "/admin/kiosk": "Self-Serve Entrance Kiosk",
  "/admin/onboarding": "Facility Onboarding Setup",
  "/staff": "Front Desk Operations",
  "/staff/members": "Member Directory & Check-In",
  "/staff/attendance": "Live Check-ins & Floor Roster",
  "/staff/classes": "Class Rosters & Sessions",
  "/staff/kiosk": "Self-Serve Kiosk Terminal",
};

export function DashboardShell({ gymName, userEmail, children }: DashboardShellProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  // Full-screen Onboarding Wizard bypass
  if (pathname === "/admin/onboarding") {
    return <>{children}</>;
  }

  const isStaff = pathname.startsWith("/staff");
  const navItems = isStaff ? staffNavItems : adminNavItems;

  // Sidebar expanded / collapsed
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pillTouchStartX = useRef<number>(0);

  // Auto-detect mobile screen
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Scroll detection for floating navbar glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync pinned preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("gymerp:sidebar_pinned");
      if (stored !== null) setIsPinned(stored === "true");
    } catch {}
  }, []);

  const togglePin = () => {
    const next = !isPinned;
    setIsPinned(next);
    try {
      localStorage.setItem("gymerp:sidebar_pinned", String(next));
    } catch {}
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isExpanded = isPinned || isSidebarHovered;
  const displayName = userEmail.split("@")[0] || "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();

  const currentPageLabel =
    PAGE_LABELS[pathname] ||
    Object.entries(PAGE_LABELS).find(([key]) => pathname.startsWith(key) && key !== "/admin")?.[1] ||
    "Dashboard";

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex relative selection:bg-white/20 selection:text-white">
      {/* Subtle Ambient Glows to enrich frosted glass refraction */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[12%] left-[8%] w-[500px] h-[500px] rounded-full bg-indigo-500/[0.025] blur-[140px]" />
        <div className="absolute top-[35%] -left-[10%] w-[450px] h-[450px] rounded-full bg-sky-500/[0.02] blur-[140px]" />
        <div className="absolute -bottom-[10%] right-[5%] w-[600px] h-[600px] rounded-full bg-violet-500/[0.02] blur-[150px]" />
      </div>

      {/* 1. Desktop Floating Frosted Glass Sidebar (matching navbar rounded-2xl) */}
      {!isMobile && (
        <aside
          onMouseEnter={() => {
            if (!isPinned) setIsSidebarHovered(true);
          }}
          onMouseLeave={() => {
            if (!isPinned) setIsSidebarHovered(false);
          }}
          className={cn(
            "fixed top-4 left-4 bottom-4 z-40 shrink-0 rounded-2xl bg-white/80 dark:bg-white/[0.03] backdrop-blur-2xl [backdrop-filter:blur(24px)_saturate(130%)] border border-zinc-200/80 dark:border-white/[0.08] shadow-xl shadow-zinc-900/5 dark:shadow-black/40 flex flex-col justify-between select-none transition-[width] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden",
            isExpanded ? "w-56" : "w-16"
          )}
        >
          {/* Top Logo Block */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200/60 dark:border-white/[0.06] px-3 py-2.5">
            <Link href={isStaff ? "/staff" : "/admin"} className="flex items-center gap-2.5 overflow-hidden group">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-gradient-to-br dark:from-white/12 dark:to-white/[0.02] text-white border border-zinc-700 dark:border-white/15 flex items-center justify-center font-bold text-xs tracking-tight shrink-0 shadow-sm group-hover:border-zinc-500 dark:group-hover:border-white/30 transition-all">
                G
              </div>
              {isExpanded && (
                <div className="flex flex-col overflow-hidden animate-in fade-in duration-150">
                  <span className="font-bold text-zinc-900 dark:text-white text-xs tracking-tight leading-none">
                    GYMERP
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[110px] mt-1">
                    {gymName}
                  </span>
                </div>
              )}
            </Link>

            {isExpanded && (
              <button
                onClick={togglePin}
                title={isPinned ? "Collapse sidebar" : "Pin sidebar"}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] border border-transparent hover:border-zinc-200 dark:hover:border-white/[0.06] transition-all"
              >
                {isPinned ? (
                  <PanelLeftClose className="w-3.5 h-3.5" />
                ) : (
                  <PanelLeft className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                )}
              </button>
            )}
          </div>

          {/* User Info Block under Header */}
          <div className="p-2.5 border-b border-zinc-200/60 dark:border-white/[0.06]">
            <div className={cn("flex items-center", isExpanded ? "gap-2.5" : "justify-center")}>
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-white flex items-center justify-center font-mono text-[11px] font-semibold shrink-0">
                {initials}
              </div>
              {isExpanded && (
                <div className="flex-1 min-w-0 animate-in fade-in duration-150">
                  <p className="font-medium text-zinc-900 dark:text-white truncate text-xs leading-tight">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {isStaff ? "Staff Member" : "Administrator"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links with stable, non-wobbling icon slots */}
          <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden space-y-1">
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
                    "flex items-center rounded-xl transition-colors duration-150 text-xs font-medium relative h-9 group overflow-hidden",
                    isActive
                      ? "bg-zinc-100 dark:bg-white/[0.08] text-zinc-900 dark:text-white font-semibold border border-zinc-200 dark:border-white/[0.1] shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-white/[0.04] hover:text-zinc-900 dark:hover:text-white border border-transparent"
                  )}
                >
                  {/* Stable fixed icon slot — never moves or twitches */}
                  <div className="w-11 h-9 shrink-0 flex items-center justify-center">
                    <item.icon
                      className={cn(
                        "w-4 h-4 transition-colors duration-150",
                        isActive ? "text-primary dark:text-white" : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200"
                      )}
                    />
                  </div>

                  {/* Label smoothly fades in without shifting icon */}
                  <span
                    className={cn(
                      "truncate transition-opacity duration-200",
                      isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Footer Logout Block */}
          <div className="p-2 border-t border-zinc-200/60 dark:border-white/[0.06]">
            <button
              onClick={logout}
              title="Sign out"
              className="w-full flex items-center h-9 rounded-xl text-red-500/80 hover:text-red-600 dark:text-red-400/80 dark:hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors text-xs font-medium overflow-hidden"
            >
              <div className="w-11 h-9 shrink-0 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              {isExpanded && <span className="truncate">Sign Out</span>}
            </button>
          </div>
        </aside>
      )}

      {/* 2. Mobile Frosted Glass Drawer */}
      {isMobile && (
        <>
          {isMobileOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setIsMobileOpen(false)}
            />
          )}

          <div
            className={cn(
              "fixed left-3 top-3 bottom-3 z-50 w-72 rounded-2xl bg-zinc-950/90 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/50 flex flex-col justify-between transition-transform duration-300 ease-out overflow-hidden",
              isMobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {/* Mobile Header */}
            <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-white/12 to-white/[0.02] text-white border border-white/15 flex items-center justify-center font-bold text-xs shadow-md">
                  G
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-white tracking-tight leading-none">GYMERP</span>
                  <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[130px] mt-1">
                    {gymName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* User Info Block in Mobile */}
            <div className="p-4 border-b border-white/[0.06] bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 text-white flex items-center justify-center font-mono text-xs font-semibold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate text-xs leading-tight">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate font-mono mt-0.5">
                    {userEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all",
                      isActive
                        ? "bg-white/[0.08] text-white font-semibold border border-white/[0.1]"
                        : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-zinc-400")} />
                      <span>{item.title}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Footer */}
            <div className="p-3.5 border-t border-white/[0.06]">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors text-xs font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
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
              className="fixed left-0 top-1/2 -translate-y-1/2 z-40 w-3 h-28 rounded-r-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-l-0 border-white/10 cursor-pointer flex items-center justify-center transition-colors"
              title="Open Navigation"
            >
              <div className="w-0.5 h-6 rounded-full bg-white/40" />
            </div>
          )}
        </>
      )}

      {/* 3. Main Content Container */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 relative z-10 transition-[padding] duration-300 ease-out",
          isMobile ? "pl-0" : isPinned ? "lg:pl-64" : "lg:pl-24"
        )}
      >
        {/* Floating Frosted Glass Navbar — Stays fixed on top when scrolled */}
        <header
          className={cn(
            "fixed top-3 sm:top-4 z-30 transition-all duration-300 ease-out flex items-center justify-between",
            isMobile
              ? "left-3 right-3 sm:left-4 sm:right-4"
              : isPinned
              ? "lg:left-64 lg:right-6 xl:right-8"
              : "lg:left-24 lg:right-6 xl:right-8",
            "h-14 rounded-2xl px-4 sm:px-6 pointer-events-auto",
            isScrolled
              ? "bg-white/85 dark:bg-[#090a0f]/85 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/[0.12] shadow-xl shadow-zinc-900/5 dark:shadow-black/50"
              : "bg-white/70 dark:bg-[#090a0f]/60 backdrop-blur-xl border border-zinc-200/70 dark:border-white/[0.08] shadow-md shadow-zinc-900/5 dark:shadow-black/20"
          )}
        >
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setIsMobileOpen(true)}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/[0.08] transition-all"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            {/* Breadcrumb Hierarchy */}
            <nav className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 font-medium">GYMERP</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
              <span className="font-semibold text-zinc-900 dark:text-white tracking-tight">{currentPageLabel}</span>
            </nav>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-zinc-400 font-medium">
              {gymName}
            </span>

            <div className="h-4 w-px bg-zinc-200 dark:bg-white/[0.08] hidden sm:block" />

            <ThemeToggle />

            <Link
              href={isStaff ? "/staff/kiosk" : "/admin/kiosk"}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-white/[0.08] transition-all"
            >
              <QrCode className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span>Kiosk</span>
            </Link>

            <button
              title="Notifications"
              className="relative p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] border border-transparent hover:border-zinc-200 dark:hover:border-white/[0.06] transition-all"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#090a0f]" />
            </button>
          </div>
        </header>

        {/* Page Main Content with proper top clearance for fixed floating navbar */}
        <main
          key={pathname}
          className="flex-1 min-w-0 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 animate-in fade-in-50 duration-200"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
