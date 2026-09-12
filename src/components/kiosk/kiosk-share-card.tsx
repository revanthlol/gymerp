"use client";

import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Edit2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { updateKioskPassphraseAction } from "@/lib/api/kiosk";
import { toast } from "sonner";

interface KioskShareCardProps {
  gymSlug: string;
  initialPassphrase: string;
}

export function KioskShareCard({ gymSlug, initialPassphrase }: KioskShareCardProps) {
  const [passphrase, setPassphrase] = useState(initialPassphrase);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialPassphrase);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const kioskUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/kiosk/${gymSlug}`
      : `/kiosk/${gymSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(kioskUrl);
    setCopiedLink(true);
    toast.success("Kiosk link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPass = () => {
    navigator.clipboard.writeText(passphrase);
    setCopiedPass(true);
    toast.success("Passphrase copied!");
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleSavePassphrase = async () => {
    if (!editValue.trim() || editValue.length < 4) {
      toast.error("Passphrase must be at least 4 characters");
      return;
    }

    setSaving(true);
    try {
      const res = await updateKioskPassphraseAction(editValue);
      if (res.success) {
        setPassphrase(res.passphrase);
        setIsEditing(false);
        toast.success("Kiosk passphrase updated!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update passphrase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#0c0e12] via-[#0f1117] to-[#0c0e12] shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Standalone Kiosk Station</span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Sharable
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Run this dynamic QR screen on a dedicated front-desk iPad or TV without admin login.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleCopyLink}
            variant="outline"
            className="h-8 border-white/[0.08] text-xs text-zinc-200 hover:text-white bg-white/[0.03] gap-1.5"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Kiosk Link</span>
          </Button>

          <a href={`/kiosk/${gymSlug}`} target="_blank" rel="noreferrer">
            <Button
              size="sm"
              className="h-8 bg-primary hover:bg-primary-deep text-[#08090a] font-bold text-xs gap-1.5"
            >
              <span>Launch Station</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* URL Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400">Public Kiosk Station URL</label>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={kioskUrl}
              className="h-9 bg-black/40 border-white/[0.08] text-xs font-mono text-zinc-300 select-all"
            />
          </div>
        </div>

        {/* Passphrase Configuration */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-primary" />
              <span>Unlock Passphrase / PIN</span>
            </label>
            {!isEditing && (
              <button
                onClick={() => {
                  setEditValue(passphrase);
                  setIsEditing(true);
                }}
                className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Change</span>
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Enter new passphrase (min 4 chars)"
                className="h-9 bg-black/40 border-white/[0.1] text-xs font-mono text-white"
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleSavePassphrase}
                disabled={saving}
                className="h-9 bg-primary hover:bg-primary-deep text-[#08090a] text-xs font-bold shrink-0"
              >
                {saving ? <Spinner size="xs" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                <span>Save</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="h-9 text-xs text-zinc-400"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  readOnly
                  type={showPass ? "text" : "password"}
                  value={passphrase}
                  className="h-9 bg-black/40 border-white/[0.08] text-xs font-mono text-zinc-200 select-all pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  title={showPass ? "Hide passphrase" : "Show passphrase"}
                >
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyPass}
                className="h-9 border-white/[0.08] text-xs text-zinc-300 hover:text-white bg-white/[0.02]"
              >
                {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
