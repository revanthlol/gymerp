"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Turn off loading once route completes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  // Intercept click on internal links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external, hash-only, mailto, tel, or target="_blank"
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.getAttribute("target") === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }

      // If already on the same path, don't show loader
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      setIsLoading(true);

      // Safety timeout: if page doesn't change in 6s, clear spinner
      setTimeout(() => setIsLoading(false), 6000);
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <>
          {/* Top minimal progress bar */}
          <motion.div
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 0.8 }}
            exit={{ scaleX: 1, opacity: 0 }}
            transition={{
              scaleX: { duration: 0.8, ease: "easeOut" },
              opacity: { duration: 0.2 },
            }}
            className="fixed top-0 left-0 right-0 h-[2px] bg-white origin-left z-[100] pointer-events-none"
          />

          {/* Top-right subtle spinner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            className="fixed top-4 right-4 z-[100] flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 backdrop-blur-md shadow-lg pointer-events-none"
          >
            <Spinner size="xs" className="text-white" />
            <span className="font-mono text-[11px]">Loading...</span>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
