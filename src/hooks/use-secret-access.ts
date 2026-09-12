"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useSecretPlatformAccess() {
  const router = useRouter();
  const [clicks, setClicks] = useState(0);

  // Keyboard shortcut: Ctrl+Shift+P or Cmd+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        toast.info("Entering Platform Console gateway...");
        router.push("/platform/login");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  // Click counter: 5 consecutive clicks on the secret target
  const handleSecretClick = useCallback(() => {
    setClicks((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        toast.info("Platform Superadmin sequence verified");
        router.push("/platform/login");
        return 0;
      }
      return next;
    });
    setTimeout(() => setClicks(0), 2000);
  }, [router]);

  return { handleSecretClick };
}
