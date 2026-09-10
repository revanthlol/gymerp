"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
      toast.error("Failed to load rotating QR token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchQr();
    }
  }, [open]);

  // Live countdown
  useEffect(() => {
    if (!open || remainingSecs <= 0) return;
    const interval = setInterval(() => {
      setRemainingSecs((prev) => {
        if (prev <= 1) {
          fetchQr();
          return 0;
        }
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
    toast.success("Turnstile token copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-medium"
          >
            <QrCode className="w-4 h-4 text-brand" />
            <span>Turnstile QR Code</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-[#0e0e12] border-zinc-800 text-zinc-100">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
            <QrCode className="w-4 h-4 text-brand" />
            <span>Dynamic Entrance QR Generator</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Cryptographic 2-hour rolling token. Prevents attendance proxying and screenshots.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4 space-y-4">
          {loading || !qrData ? (
            <div className="w-64 h-64 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs text-zinc-500">
              <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="p-3 bg-white rounded-2xl shadow-xl">
              <img
                src={qrData.qrDataUrl}
                alt="2-Hour Rotating Turnstile QR"
                className="w-60 h-60 object-contain"
              />
            </div>
          )}

          {/* Countdown & Refresh */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-mono">
              <div className="flex items-center gap-2 text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-brand" />
                <span>Next Rotation:</span>
              </div>
              <span className="text-brand font-bold text-xs">{formatTimer(remainingSecs)}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 pt-1">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>2-Hour Anti-Proxy Active</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="hover:text-white flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy Token"}</span>
                </button>
                <button
                  onClick={fetchQr}
                  disabled={loading}
                  className="hover:text-white flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
