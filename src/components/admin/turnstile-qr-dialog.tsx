"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { QrCode, Clock, RefreshCw, ShieldCheck, Copy, Check } from "lucide-react";
import { getRotatingQrAction } from "@/lib/api/attendance";
import { toast } from "sonner";

interface TurnstileQrDialogProps {
  trigger?: React.ReactNode;
}

export function TurnstileQrDialog({ trigger }: TurnstileQrDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<{
    tokenString: string;
    qrDataUrl: string;
    remainingSeconds: number;
  } | null>(null);
  const [remainingSecs, setRemainingSecs] = useState(0);
  const [copied, setCopied] = useState(false);

  const fetchQr = async () => {
    setLoading(true);
    try {
      const data = await getRotatingQrAction();
      setQrData(data);
      setRemainingSecs(data.remainingSeconds);
    } catch {
      toast.error("Failed to load QR token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchQr();
  }, [open]);

  useEffect(() => {
    if (!open || remainingSecs <= 0) return;
    const interval = setInterval(() => {
      setRemainingSecs((prev) => {
        if (prev <= 1) { fetchQr(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open, remainingSecs]);

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}h ` : ""}${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  };

  const handleCopy = () => {
    if (!qrData) return;
    navigator.clipboard.writeText(qrData.tokenString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Check-in token copied");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <QrCode className="size-3.5 text-primary" />
            Check-In QR
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="size-4 text-primary" />
            Entrance QR Pass
          </DialogTitle>
          <DialogDescription>
            Auto-refreshing pass for gym entrance scanning.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col items-center gap-5 py-2">
          {/* QR Code */}
          {loading || !qrData ? (
            <div className="w-56 h-56 rounded-xl bg-muted/60 border border-border flex items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : (
            <div className="p-3 bg-white rounded-xl shadow-sm border border-border">
              <img
                src={qrData.qrDataUrl}
                alt="Entrance QR Code"
                className="w-52 h-52 object-contain"
              />
            </div>
          )}

          {/* Countdown */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-muted/60 border border-border text-xs font-mono">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-3.5 text-primary" />
                <span>Next rotation:</span>
              </div>
              <span className="text-primary font-bold">{formatTimer(remainingSecs)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <div className="flex items-center gap-1.5 text-primary">
                <ShieldCheck className="size-3.5" />
                <span>Dynamic pass active</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={fetchQr}
                  disabled={loading}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
