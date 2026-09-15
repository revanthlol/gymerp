"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Flame,
  Dumbbell,
  CreditCard,
  LogOut,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { memberLogoutAction } from "@/lib/api/member-portal";
import { KioskScannerModal } from "@/components/portal/kiosk-scanner-modal";

// ── Custom QR Scan Icon ─────────────────────────────────────────────────────
function QrScanIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Top-left corner bracket */}
      <path d="M3 7V4h3" />
      {/* Top-right corner bracket */}
      <path d="M21 7V4h-3" />
      {/* Bottom-left corner bracket */}
      <path d="M3 17v3h3" />
      {/* Bottom-right corner bracket */}
      <path d="M21 17v3h-3" />
      {/* Inner QR square */}
      <rect x="7" y="7" width="4" height="4" rx="0.5" />
      <rect x="13" y="7" width="4" height="4" rx="0.5" />
      <rect x="7" y="13" width="4" height="4" rx="0.5" />
      {/* Scan line */}
      <line x1="13" y1="13" x2="17" y2="13" />
      <line x1="17" y1="13" x2="17" y2="17" />
      <line x1="13" y1="17" x2="17" y2="17" />
    </svg>
  );
}

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
  { title: "Overview",           href: "/portal",            icon: LayoutDashboard },
  { title: "Workouts & Streaks", href: "/portal/attendance", icon: Flame },
  { title: "Classes",            href: "/portal/classes",    icon: Dumbbell },
  { title: "Membership",         href: "/portal/membership", icon: CreditCard },
];

const PAGE_LABELS: Record<string, string> = {
  "/portal":            "Member Overview",
  "/portal/attendance": "Workouts & Streaks",
  "/portal/classes":    "Group Fitness Classes",
  "/portal/membership": "Membership & Invoices",
};

export function PortalShell({ member, gym, children }: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isPinned, setIsPinned]       = useState(true);
  const [isHovered, setIsHovered]     = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isScrolled, setIsScrolled]   = useState(false);
  const [isMobile, setIsMobile]       = useState(false);

  // Restore sidebar preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem("gymerp:member_sidebar_pinned");
      if (stored !== null) setIsPinned(stored === "true");
    } catch {}
  }, []);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Scroll detection for floating navbar gloss
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/portal");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex relative selection:bg-primary/20 selection:text-foreground overflow-x-hidden">

      {/* Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[12%] left-[8%] w-[500px] h-[500px] rounded-full bg-amber-500/[0.04] dark:bg-amber-500/[0.025] blur-[140px]" />
        <div className="absolute -bottom-[10%] right-[5%] w-[600px] h-[600px] rounded-full bg-amber-600/[0.03] dark:bg-amber-600/[0.02] blur-[150px]" />
      </div>

      {/* ── DESKTOP FLOATING SIDEBAR (lg+) ─────────────────────────────── */}
      {!isMobile && (
        <aside
          onMouseEnter={() => { if (!isPinned) setIsHovered(true); }}
          onMouseLeave={() => { if (!isPinned) setIsHovered(false); }}
          className={cn(
            "fixed top-4 left-4 bottom-4 z-40 shrink-0 rounded-2xl",
            "bg-white/70 dark:bg-black/50 backdrop-blur-2xl [backdrop-filter:blur(24px)_saturate(160%)]",
            "border border-stone-200/70 dark:border-white/[0.1]",
            "shadow-[0_12px_40px_rgba(0,0,0,0.06),inset_0_1px_0_0_rgba(255,255,255,0.6)]",
            "dark:shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)]",
            "flex flex-col justify-between select-none",
            "transition-[width] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden",
            isExpanded ? "w-56" : "w-16"
          )}
        >
          {/* Logo Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200/60 dark:border-white/[0.06] px-3 py-2.5">
            <Link href="/" className="flex items-center gap-2.5 overflow-hidden group">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-gradient-to-br dark:from-white/12 dark:to-white/[0.02] text-white border border-zinc-700 dark:border-white/15 flex items-center justify-center font-bold text-xs tracking-tight shrink-0 shadow-sm group-hover:border-zinc-500 dark:group-hover:border-white/30 transition-all">
                {gym.logoUrl ? (
                  <img src={gym.logoUrl} alt={gym.name} className="w-full h-full object-cover rounded-xl" />
                ) : gym.name.slice(0, 1).toUpperCase()}
              </div>
              {isExpanded && (
                <div className="flex flex-col overflow-hidden animate-in fade-in duration-150">
                  <span className="font-bold text-zinc-900 dark:text-white text-xs tracking-tight leading-none">
                    {gym.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                    Athlete Portal
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
                {isPinned ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />}
              </button>
            )}
          </div>

          {/* Quick Check-In Button */}
          <div className="p-2.5 border-b border-stone-200/60 dark:border-white/[0.06]">
            <button
              onClick={() => setScannerOpen(true)}
              className={cn(
                "w-full h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] text-xs"
              )}
            >
              <QrScanIcon className="w-4 h-4 shrink-0" />
              {isExpanded && <span>Scan Kiosk / Check In</span>}
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden space-y-1">
            {memberNavItems.map((item) => {
              const isActive =
                item.href === "/portal"
                  ? pathname === "/portal"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!isExpanded ? item.title : undefined}
                  className={cn(
                    "flex items-center rounded-xl transition-colors duration-150 text-xs font-medium relative h-9 group overflow-hidden",
                    isActive
                      ? "bg-primary/10 dark:bg-white/[0.08] text-primary dark:text-white font-semibold border border-primary/20 dark:border-white/[0.1] shadow-xs"
                      : "text-stone-600 dark:text-zinc-400 hover:bg-stone-100/80 dark:hover:bg-white/[0.04] hover:text-stone-900 dark:hover:text-white border border-transparent"
                  )}
                >
                  <div className="w-11 h-9 shrink-0 flex items-center justify-center">
                    <Icon className={cn(
                      "w-4 h-4 transition-colors duration-150",
                      isActive ? "text-primary dark:text-white" : "text-stone-400 dark:text-zinc-400 group-hover:text-stone-700 dark:group-hover:text-zinc-200"
                    )} />
                  </div>
                  <span className={cn(
                    "truncate transition-opacity duration-200",
                    isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}>
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Footer: User Info + Logout */}
          <div className="p-2 border-t border-stone-200/60 dark:border-white/[0.06]">
            <div className={cn("flex items-center mb-2", isExpanded ? "gap-2.5 px-1" : "justify-center")}>
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-white flex items-center justify-center font-mono text-[11px] font-semibold shrink-0">
                {initials}
              </div>
              {isExpanded && (
                <div className="flex-1 min-w-0 animate-in fade-in duration-150">
                  <p className="font-medium text-zinc-900 dark:text-white truncate text-xs leading-tight">
                    {member.fullName}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate mt-0.5">
                    UID: #{member.id.slice(0, 8)}
                  </p>
                </div>
              )}
            </div>
            <form action={memberLogoutAction}>
              <button
                type="submit"
                title="Sign out"
                className="w-full flex items-center h-9 rounded-xl text-red-500/80 hover:text-red-600 dark:text-red-400/80 dark:hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors text-xs font-medium overflow-hidden"
              >
                <div className="w-11 h-9 shrink-0 flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                {isExpanded && <span className="truncate">Sign Out</span>}
              </button>
            </form>
          </div>
        </aside>
      )}

      {/* ── MAIN CONTENT WRAPPER ─────────────────────────────────────────── */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 relative z-10 transition-[padding] duration-300 ease-out",
          isMobile ? "pl-0" : isPinned ? "lg:pl-64" : "lg:pl-24"
        )}
      >
        {/* Floating Frosted Glass Navbar */}
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
              ? "bg-white/55 dark:bg-black/55 backdrop-blur-2xl [backdrop-filter:blur(24px)_saturate(160%)_contrast(105%)] border border-zinc-200/80 dark:border-white/[0.14] shadow-[0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.25)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
              : "bg-white/40 dark:bg-black/40 backdrop-blur-2xl [backdrop-filter:blur(20px)_saturate(150%)] border border-zinc-200/70 dark:border-white/[0.1] shadow-[0_8px_30px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.2)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
          )}
        >
          {/* Left: Back button + Breadcrumb */}
          <div className="flex items-center gap-2">
            {isMobile && (
              <button
                onClick={handleBack}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/[0.08] transition-all"
                aria-label="Go back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Desktop: Logo link to landing */}
            {!isMobile && (
              <Link href="/" className="flex items-center gap-2 group mr-1">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white/10 text-white border border-zinc-700 dark:border-white/15 flex items-center justify-center font-bold text-[11px] group-hover:border-zinc-500 dark:group-hover:border-white/30 transition-all">
                  {gym.logoUrl ? (
                    <img src={gym.logoUrl} alt={gym.name} className="w-full h-full object-cover rounded-lg" />
                  ) : gym.name.slice(0, 1).toUpperCase()}
                </div>
              </Link>
            )}

            <nav className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 font-medium">Member Portal</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
              <span className="font-semibold text-zinc-900 dark:text-white tracking-tight">{currentPageLabel}</span>
            </nav>
          </div>

          {/* Right: Check In + Gym pill + Theme + Logout (mobile) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScannerOpen(true)}
              className="hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all hover:shadow hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <QrScanIcon className="w-4 h-4" />
              <span>Check In</span>
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{gym.name}</span>
            </div>

            <ThemeToggle />

            {isMobile && (
              <form action={memberLogoutAction}>
                <button
                  type="submit"
                  title="Sign out"
                  className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 min-w-0 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 lg:pb-12 animate-in fade-in-50 duration-200">
          {children}
        </main>
      </div>

      {/* ── MOBILE FLOATING BOTTOM NAV (\u003clg) ─────────────────────────────── */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 rounded-2xl bg-white/80 dark:bg-black/60 backdrop-blur-2xl [backdrop-filter:blur(24px)_saturate(160%)] border border-stone-200/70 dark:border-white/[0.1] shadow-[0_-4px_24px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3),0_8px_32px_rgba(0,0,0,0.5)] px-3 py-2">
        <div className="flex items-center justify-around relative">

          <Link
            href="/portal"
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[52px]",
              pathname === "/portal"
                ? "text-primary"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            )}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          <Link
            href="/portal/attendance"
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[52px]",
              pathname === "/portal/attendance"
                ? "text-primary"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            )}
          >
            <Flame className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Workouts</span>
          </Link>

          {/* Center floating action: Scan */}
          <button
            onClick={() => setScannerOpen(true)}
            className="flex flex-col items-center -mt-5 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-white dark:border-zinc-950 transition-transform active:scale-95 group-hover:scale-105">
              <QrScanIcon className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-bold text-primary mt-1">Check In</span>
          </button>

          <Link
            href="/portal/classes"
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[52px]",
              pathname === "/portal/classes"
                ? "text-primary"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            )}
          >
            <Dumbbell className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Classes</span>
          </Link>

          <Link
            href="/portal/membership"
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[52px]",
              pathname === "/portal/membership"
                ? "text-primary"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            )}
          >
            <CreditCard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Plan</span>
          </Link>
        </div>
      </div>

      {/* Kiosk Scanner Modal */}
      <KioskScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        memberUid={member.id}
      />
    </div>
  );
}
