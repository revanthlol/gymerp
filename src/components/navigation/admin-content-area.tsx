"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AdminContentAreaProps {
  children: React.ReactNode;
}

/**
 * Reads the sidebar pinned state from sessionStorage and adjusts
 * the main content left padding to match the sidebar width.
 * Updates reactively on storage changes.
 */
export function AdminContentArea({ children }: AdminContentAreaProps) {
  const [isPinned, setIsPinned] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const read = () => {
      const saved = sessionStorage.getItem("gym_sidebar_pinned");
      setIsPinned(saved === null ? true : saved === "true");
    };
    read();
    // Listen for sidebar pin changes via storage events
    const onStorage = (e: StorageEvent) => {
      if (e.key === "gym_sidebar_pinned") read();
    };
    window.addEventListener("storage", onStorage);
    // Also poll occasionally for same-tab changes (sessionStorage doesn't fire storage event in same tab)
    const interval = setInterval(read, 300);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, []);

  // On mobile there's no sidebar pushing content — it's a drawer overlay
  const paddingLeft = isMobile ? "pl-0" : isPinned ? "pl-64" : "pl-20";

  return (
    <div
      className={cn("flex-1 flex flex-col min-w-0 transition-[padding] duration-200 ease-out", paddingLeft)}
    >
      {children}
    </div>
  );
}
