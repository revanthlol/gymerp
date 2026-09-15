"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface SignOutConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
}

export function SignOutConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Sign Out",
  description = "Are you sure you want to end your session? You will need to sign in again to access your dashboard.",
}: SignOutConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
    } catch (err) {
      console.error("Logout failed:", err);
      setLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !loading && onOpenChange(val)}>
      <DialogContent className="sm:max-w-sm rounded-2xl bg-card/95 backdrop-blur-2xl border border-border/80 p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="size-12 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center mb-4 shadow-xs">
            <LogOut className="size-5" />
          </div>

          <DialogHeader className="p-0 border-none text-center">
            <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1.5 max-w-[260px] leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="w-full flex items-center gap-2.5 mt-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => onOpenChange(false)}
              className="flex-1 h-9 rounded-xl text-xs font-medium border-border/80 hover:bg-muted/60 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={loading}
              onClick={handleConfirm}
              className="flex-1 h-9 rounded-xl text-xs font-semibold gap-1.5 shadow-xs transition-all hover:brightness-110 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Spinner size="xs" variant="current" />
                  <span>Signing out...</span>
                </>
              ) : (
                <>
                  <LogOut className="size-3.5" />
                  <span>Sign Out</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
