"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Flame,
  Dumbbell,
  CreditCard,
  Camera,
  ScanLine,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  User,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { memberLogoutAction } from "@/lib/api/member-portal";
import { KioskScannerModal } from "@/components/portal/kiosk-scanner-modal";

interface PortalShellProps {
  member: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    status: string;
  };
  gym: {
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
  children: React.ReactNode;
}

const memberNavItems = [
  { title: "Overview", href: "/portal", icon: LayoutDashboard },
  { title: "Workouts & Streaks", href: "/portal/attendance", icon: Flame },
  { title: "Classes", href: "/portal/classes", icon: Dumbbell },
  { title: "Membership", href: "/portal/membership", icon: CreditCard },
];

const PAGE_LABELS: Record<string, string> = {
  "/portal": "Member Overview",
  "/portal/attendance": "Workouts & Streaks",
  "/portal/classes": "Group Fitness Classes",
  "/portal/membership": "Membership & Invoices",
};

export function PortalShell({ member, gym, children }: PortalShellProps) {
  const pathname = usePathname();

  // Sidebar states for desktop
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Restore sidebar preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem("gymerp:member_sidebar_pinned");
      if (stored !== null) setIsPinned(stored === "true");
    } catch {}
  }, []);

  const togglePin = () => {
    const next = !isPinned;
    setIsPinned(next);
    try {
      localStorage.setItem("gymerp:member_sidebar_pinned", String(next));
    } catch {}
  };

  const isExpanded = isPinned || isHovered;
  const initials = member.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currentPageLabel = PAGE_LABELS[pathname] || "Member Portal";

  return (
    <div className="min-h-screen bg-background text-foreground flex relative selection:bg-primary/20 selection:text-foreground">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-primary/[0.03] dark:bg-primary/[0.04] rounded-full blur-[140px] pointer-events-none" />

      {/* ---------------------------------------------------- */}
      {/* DESKTOP SIDEBAR (Visible on lg+)                     */}
      {/* ---------------------------------------------------- */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "hidden lg:flex flex-col fixed top-0 bottom-0 left-0 z-40 bg-card/75 dark:bg-card/65 backdrop-blur-xl border-r border-border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isExpanded ? "w-64" : "w-[72px]"
        )}
      >
        {/* Sidebar Header: Gym Logo & Pin Button */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/60">
          <Link href="/portal" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-base shadow-sm">
              {gym.logoUrl ? (
                <img src={gym.logoUrl} alt={gym.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                gym.name.slice(0, 1).toUpperCase()
              )}
            </div>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
                className="truncate"
              >
                <div className="text-sm font-bold text-foreground truncate tracking-tight">
                  {gym.name}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  Athlete Portal
                </div>
              </motion.div>
            )}
          </Link>

          {isExpanded && (
            <button
              onClick={togglePin}
              title={isPinned ? "Collapse sidebar" : "Pin sidebar"}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            >
              {isPinned ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Quick Kiosk Check-in Button in Sidebar */}
        <div className="p-3">
          <button
            onClick={() => setScannerOpen(true)}
            className={cn(
              "w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
              !isExpanded && "px-0"
            )}
          >
            <ScanLine className="w-4 h-4 shrink-0" />
            {isExpanded && <span className="text-xs">Scan Kiosk / Check In</span>}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto">
          {memberNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                )}
                <Icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {item.title}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: Profile, Theme, Logout */}
        <div className="p-3 border-t border-border/60 space-y-2">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/40">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
              {initials}
            </div>
            {isExpanded && (
              <div className="truncate flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">
                  {member.fullName}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono truncate">
                  UID: #{member.id.slice(0, 8)}
                </div>
              </div>
            )}
          </div>

          <div className={cn("flex items-center justify-between", !isExpanded && "flex-col gap-2")}>
            <ThemeToggle />
            <form action={memberLogoutAction}>
              <button
                type="submit"
                title="Sign out of Member Portal"
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------- */}
      {/* MAIN CONTENT WRAPPER                                 */}
      {/* ---------------------------------------------------- */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isPinned ? "lg:pl-64" : "lg:pl-[72px]"
        )}
      >
        {/* Sticky Top Header (Desktop & Mobile) */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 dark:bg-background/70 backdrop-blur-md border-b border-border/60 flex items-center justify-between px-4 sm:px-6 md:px-8">
          {/* Left: Breadcrumb / Mobile Brand */}
          <div className="flex items-center gap-3">
            {/* Mobile Gym Icon */}
            <div className="lg:hidden w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-sm">
              {gym.logoUrl ? (
                <img src={gym.logoUrl} alt={gym.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                gym.name.slice(0, 1).toUpperCase()
              )}
            </div>

            {/* Breadcrumb on Desktop */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-muted-foreground hidden sm:inline">Member Portal</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 hidden sm:inline" />
              <span className="text-foreground font-semibold">{currentPageLabel}</span>
            </div>
          </div>

          {/* Right: Quick Check In & Member Pill */}
          <div className="flex items-center gap-3">
            {/* Desktop Check In button */}
            <button
              onClick={() => setScannerOpen(true)}
              className="hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all hover:shadow hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <ScanLine className="w-4 h-4" />
              <span>Check In at Kiosk</span>
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-foreground">{gym.name}</span>
            </div>

            <div className="lg:hidden flex items-center gap-2">
              <ThemeToggle />
              <form action={memberLogoutAction}>
                <button
                  type="submit"
                  title="Sign out"
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Main Body View */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto pb-28 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MOBILE FROSTED GLASS BOTTOM NAVIGATION BAR (<lg)    */}
      {/* ---------------------------------------------------- */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/85 dark:bg-background/75 backdrop-blur-xl border-t border-border/80 px-2 py-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-around relative">
          {/* 1. Overview */}
          <Link
            href="/portal"
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all",
              pathname === "/portal" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Home</span>
          </Link>

          {/* 2. Workouts */}
          <Link
            href="/portal/attendance"
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all",
              pathname === "/portal/attendance" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Flame className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Workouts</span>
          </Link>

          {/* 3. CENTER FLOATING ACTION: SCAN KIOSK */}
          <button
            onClick={() => setScannerOpen(true)}
            className="flex flex-col items-center -mt-5 group cursor-pointer"
          >
            <div className="w-13 h-13 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-background transition-transform active:scale-95 group-hover:scale-105">
              <ScanLine className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-bold text-primary mt-1">Check In</span>
          </button>

          {/* 4. Classes */}
          <Link
            href="/portal/classes"
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all",
              pathname === "/portal/classes" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Dumbbell className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Classes</span>
          </Link>

          {/* 5. Membership */}
          <Link
            href="/portal/membership"
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all",
              pathname === "/portal/membership" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CreditCard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Plan</span>
          </Link>
        </div>
      </div>

      {/* Unified Kiosk Scanner & Manual Code Modal */}
      <KioskScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        memberUid={member.id}
      />
    </div>
  );
}
