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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  gymName: string;
  userEmail: string;
}

const sidebarItems = [
  { title: "Dashboard",   href: "/admin",              icon: LayoutDashboard },
  { title: "Members",     href: "/admin/members",       icon: Users },
  { title: "Attendance",  href: "/admin/attendance",    icon: Inbox },
  { title: "Classes",     href: "/admin/classes",       icon: Dumbbell },
  { title: "Plans",       href: "/admin/plans",         icon: Sliders },
  { title: "Payments",    href: "/admin/payments",      icon: CreditCard },
  { title: "Analytics",   href: "/admin/analytics",     icon: BarChart3 },
  { title: "Kiosk",       href: "/staff/kiosk",         icon: QrCode },
];

const sidebarVariants = {
  open:   { width: "16rem" },
  closed: { width: "5rem" },
};

const textVariants = {
  open: {
    opacity: 1,
    x: 0,
    display: "block",
    transition: { duration: 0.18, ease: "easeOut" } as const,
  },
  closed: {
    opacity: 0,
    x: -8,
    transitionEnd: { display: "none" },
    transition: { duration: 0.15, ease: "easeIn" } as const,
  },
};

const transitionProps = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
} as const;

export function AdminSidebar({ gymName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const [isPinned, setIsPinned] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = sessionStorage.getItem("gym_sidebar_pinned");
    return saved === null ? true : saved === "true";
  });
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pillTouchStartX = useRef(0);

  const effectivelyOpen = isMobile ? true : (isPinned || isHovered);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isMobile) sessionStorage.setItem("gym_sidebar_pinned", isPinned.toString());
  }, [isPinned, isMobile]);

  // Close mobile sidebar on route change
  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  const displayName = userEmail.split("@")[0] || "admin";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleMouseEnter = () => {
    if (!isPinned && !isMobile) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned && !isMobile) {
      setIsHovered(false);
    }
  };

  const handlePillTouchStart = (e: React.TouchEvent) => {
    pillTouchStartX.current = e.touches[0].clientX;
  };
  const handlePillTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - pillTouchStartX.current;
    if (dx > 40) setIsMobileOpen(true);
  };

  const SidebarContent = ({ open }: { open: boolean }) => (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center border-b border-white/[0.06] px-4 relative">
        <Link href="/admin" className="flex items-center gap-3 w-full group">
          <div className="w-8 h-8 rounded-full bg-brand text-black flex items-center justify-center font-black text-sm tracking-tighter shadow-[0_0_16px_rgba(118,185,0,0.35)] group-hover:scale-105 transition-transform shrink-0">
            G
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                variants={textVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="flex flex-col overflow-hidden"
              >
                <p className="truncate text-sm font-extrabold text-white tracking-widest leading-none">GRYM</p>
                <p className="truncate text-[10px] text-zinc-400 font-mono leading-tight max-w-[120px]">{gymName}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* Pin toggle — only when open */}
        {open && !isMobile && (
          <button
            onClick={() => setIsPinned(p => !p)}
            title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all"
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 px-3 py-4 overflow-y-auto scrollbar-none">
        <div className="flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const isActive = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => { if (!isPinned) { setIsHovered(false); } }}
                className={cn(
                  "group flex h-11 w-full items-center rounded-xl transition-all duration-200 relative",
                  isActive
                    ? "bg-brand/10 text-brand"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200",
                  open ? "px-3" : "justify-center"
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand rounded-full shadow-[0_0_8px_rgba(118,185,0,0.8)]" />
                )}
                <item.icon className={cn(
                  "shrink-0 transition-colors",
                  open ? "w-[18px] h-[18px] ml-1" : "w-5 h-5",
                  isActive ? "text-brand" : "text-zinc-500 group-hover:text-zinc-300"
                )} />
                <AnimatePresence>
                  {open && (
                    <motion.span
                      variants={textVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      className="ml-3 truncate text-sm font-medium"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-white/[0.06] p-3 space-y-1">
        {/* Sign Out */}
        <button
          onClick={logout}
          className={cn(
            "flex h-10 w-full items-center rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all gap-3",
            open ? "px-3" : "justify-center"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {open && (
              <motion.span
                variants={textVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="text-[13px] font-semibold tracking-tight"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User Profile */}
        <div className={cn(
          "flex h-12 w-full items-center gap-3 transition-all",
          open ? "px-2" : "justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-xs shrink-0">
            {initials}
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                variants={textVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="flex flex-col overflow-hidden"
              >
                <p className="truncate text-[11px] font-bold text-white uppercase tracking-tight leading-tight">{displayName}</p>
                <p className="truncate text-[10px] text-zinc-400 font-mono leading-none">Admin</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          className="fixed left-0 top-0 z-40 h-full shrink-0 sidebar-border-right bg-zinc-950/95 backdrop-blur-xl"
          initial={effectivelyOpen ? "open" : "closed"}
          animate={effectivelyOpen ? "open" : "closed"}
          variants={sidebarVariants}
          transition={transitionProps}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <SidebarContent open={effectivelyOpen} />
        </motion.aside>
      )}

      {/* Mobile Drawer */}
      {isMobile && isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <motion.aside
            className="fixed left-0 top-0 z-50 h-full w-64 border-r border-white/[0.06] bg-zinc-950"
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
          >
            <SidebarContent open={true} />
          </motion.aside>
        </>
      )}

      {/* Mobile Hamburger Button (top-left) */}
      {isMobile && !isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed left-3 top-3 z-50 p-2 rounded-xl bg-zinc-900/90 border border-white/[0.08] text-zinc-400 hover:text-white backdrop-blur-md"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile swipe pill */}
      {isMobile && !isMobileOpen && (
        <div
          onTouchStart={handlePillTouchStart}
          onTouchEnd={handlePillTouchEnd}
          onClick={() => setIsMobileOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 w-3.5 h-40 rounded-r-full bg-white/10 touch-none select-none cursor-pointer flex items-center justify-center"
        >
          <div className="w-1 h-8 rounded-full bg-white/20" />
        </div>
      )}
    </>
  );
}
