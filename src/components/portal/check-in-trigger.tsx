"use client";

import React, { useState } from "react";
import { ScanLine, ArrowRight } from "lucide-react";
import { KioskScannerModal } from "@/components/portal/kiosk-scanner-modal";
import { cn } from "@/lib/utils";

interface CheckInTriggerProps {
  memberUid: string;
  variant?: "hero" | "compact" | "icon";
  className?: string;
}

export function CheckInTrigger({ memberUid, variant = "hero", className }: CheckInTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "hero" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "group relative inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer",
            className
          )}
        >
          <ScanLine className="w-5 h-5 stroke-[2.2] group-hover:scale-110 transition-transform" />
          <span>Check In at Kiosk</span>
          <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>
      ) : variant === "compact" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer",
            className
          )}
        >
          <ScanLine className="w-4 h-4" />
          <span>Check In</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer",
            className
          )}
        >
          <ScanLine className="w-5 h-5" />
        </button>
      )}

      <KioskScannerModal
        open={open}
        onClose={() => setOpen(false)}
        memberUid={memberUid}
      />
    </>
  );
}
