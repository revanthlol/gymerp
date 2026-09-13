"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Monitor,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Printer,
  RefreshCw,
  Trash2,
  Edit2,
  ShieldCheck,
  ArrowRightLeft,
  LogIn,
  LogOut,
  Radio,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Dumbbell,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createKioskAction,
  updateKioskAction,
  regenerateKioskTokenAction,
  deleteKioskAction,
} from "@/lib/api/kiosk";
import { toast } from "sonner";
import { KioskTerminal } from "@/components/kiosk/kiosk-terminal";

interface KioskRecord {
  id: string;
  name: string;
  slug: string;
  secretToken: string;
  mode: string;
  isActive: string;
  lastHeartbeatAt: Date | string | null;
  createdAt: Date | string;
}

interface KioskManagementViewProps {
  initialKiosks: KioskRecord[];
  gym: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
  // Props for manual receptionist terminal
  initialQr: any;
  members: any[];
  recentAttendance: any[];
}

export function KioskManagementView({
  initialKiosks,
  gym,
  initialQr,
  members,
  recentAttendance,
}: KioskManagementViewProps) {
  const [activeTab, setActiveTab] = useState<"stations" | "receptionist">("stations");
  const [kiosks, setKiosks] = useState<KioskRecord[]>(initialKiosks);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createMode, setCreateMode] = useState<"auto" | "entry" | "exit">("auto");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingKiosk, setEditingKiosk] = useState<KioskRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editMode, setEditMode] = useState<"auto" | "entry" | "exit">("auto");
  const [editActive, setEditActive] = useState<"true" | "false">("true");

  const [printKiosk, setPrintKiosk] = useState<KioskRecord | null>(null);

  // Copy URL to clipboard
  const handleCopyUrl = (token: string, id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/kiosk/station?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Kiosk Station URL copied to clipboard");
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Create new kiosk
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await createKioskAction({
        name: createName.trim(),
        mode: createMode,
      });
      if (res.kiosk) {
        setKiosks((prev) => [...prev, res.kiosk as any]);
        toast.success(`Kiosk "${createName}" registered successfully`);
        setIsCreateOpen(false);
        setCreateName("");
        setCreateMode("auto");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create kiosk station");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update existing kiosk
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKiosk || !editName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await updateKioskAction({
        id: editingKiosk.id,
        name: editName.trim(),
        mode: editMode,
        isActive: editActive,
      });
      if (res.kiosk) {
        setKiosks((prev) =>
          prev.map((k) => (k.id === editingKiosk.id ? (res.kiosk as any) : k))
        );
        toast.success(`Kiosk updated`);
        setEditingKiosk(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update kiosk");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Regenerate secret token
  const handleRegenerate = async (kioskId: string, kioskName: string) => {
    if (!confirm(`Are you sure you want to regenerate the token for "${kioskName}"? Any screen currently using the old link will need to be reloaded with the new URL.`)) {
      return;
    }

    try {
      const res = await regenerateKioskTokenAction(kioskId);
      if (res.kiosk) {
        setKiosks((prev) =>
          prev.map((k) => (k.id === kioskId ? (res.kiosk as any) : k))
        );
        toast.success("New token generated");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to regenerate token");
    }
  };

  // Delete kiosk
  const handleDelete = async (kioskId: string, kioskName: string) => {
    if (!confirm(`Are you sure you want to delete kiosk station "${kioskName}"?`)) {
      return;
    }

    try {
      await deleteKioskAction(kioskId);
      setKiosks((prev) => prev.filter((k) => k.id !== kioskId));
      toast.success(`Kiosk "${kioskName}" removed`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete kiosk");
    }
  };

  // Check if kiosk is online (heartbeat in last 3 minutes)
  const isOnline = (heartbeat: Date | string | null) => {
    if (!heartbeat) return false;
    const diff = Date.now() - new Date(heartbeat).getTime();
    return diff < 3 * 60 * 1000;
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Check-In Turnstiles & Kiosks
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure multi-turnstile zero-touch displays and printable acrylic desk stands.
          </p>
        </div>

        {/* Tab Selector & Add Button */}
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-xl bg-muted/60 border border-border flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab("stations")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "stations"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5" />
                <span>Station Displays ({kiosks.length})</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("receptionist")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "receptionist"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5" />
                <span>Front-Desk Terminal</span>
              </span>
            </button>
          </div>

          {activeTab === "stations" && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Register Kiosk</span>
            </Button>
          )}
        </div>
      </div>

      {activeTab === "receptionist" ? (
        /* Front-Desk Receptionist Terminal */
        <KioskTerminal
          initialQr={initialQr}
          members={members}
          recentAttendance={recentAttendance}
        />
      ) : (
        /* Multiple Kiosk Stations Management View */
        <div className="space-y-5">
          {/* Station Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5 transition-all hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{kiosks.length}</div>
                <div className="text-xs text-muted-foreground">Configured Stations</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5 transition-all hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">
                  {kiosks.filter((k) => isOnline(k.lastHeartbeatAt)).length}
                </div>
                <div className="text-xs text-muted-foreground">Active Online Now</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5 transition-all hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">Zero-Touch</div>
                <div className="text-xs text-muted-foreground">Real-Time Event Stream</div>
              </div>
            </div>
          </div>

          {/* Kiosks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {kiosks.map((kiosk) => {
              const online = isOnline(kiosk.lastHeartbeatAt);
              const stationUrl = `/kiosk/station?token=${kiosk.secretToken}`;

              return (
                <div
                  key={kiosk.id}
                  className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-4 transition-all hover:shadow-md hover:border-border/80 flex flex-col justify-between"
                >
                  {/* Top Bar: Name & Mode */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground tracking-tight">
                            {kiosk.name}
                          </h3>
                          {kiosk.isActive !== "true" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          ID: #{kiosk.secretToken.slice(0, 8)}
                        </p>
                      </div>

                      {/* Online status indicator */}
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                          online
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            online ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"
                          }`}
                        />
                        <span>{online ? "Online" : "Idle / Offline"}</span>
                      </div>
                    </div>

                    {/* Mode Pill */}
                    <div>
                      {kiosk.mode === "entry" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <LogIn className="w-3 h-3" />
                          <span>Entry Turnstile Only</span>
                        </span>
                      ) : kiosk.mode === "exit" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <LogOut className="w-3 h-3" />
                          <span>Exit Turnstile Only</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Auto Entry/Exit Detection</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Display URL Box */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Zero-Touch Station URL
                    </label>
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/50 border border-border text-xs font-mono">
                      <span className="truncate flex-1 text-foreground/80">
                        {stationUrl}
                      </span>
                      <button
                        onClick={() => handleCopyUrl(kiosk.secretToken, kiosk.id)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy Station URL"
                      >
                        {copiedId === kiosk.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Link href={stationUrl} target="_blank">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs font-medium rounded-lg flex items-center gap-1.5 border-border hover:bg-muted"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Station</span>
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrintKiosk(kiosk)}
                        className="h-8 px-2.5 text-xs font-medium rounded-lg flex items-center gap-1.5 border-border hover:bg-muted"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Stand</span>
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingKiosk(kiosk);
                          setEditName(kiosk.name);
                          setEditMode((kiosk.mode as any) || "auto");
                          setEditActive((kiosk.isActive as any) || "true");
                        }}
                        title="Edit Kiosk"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleRegenerate(kiosk.id, kiosk.name)}
                        title="Regenerate Secret Token"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      {kiosks.length > 1 && (
                        <button
                          onClick={() => handleDelete(kiosk.id, kiosk.name)}
                          title="Delete Kiosk"
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE KIOSK DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Register New Turnstile Station</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Station Name</label>
              <Input
                required
                placeholder="e.g. Upstairs Turnstile, Cardio Zone, Back Gate"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="h-10 rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">
                Displayed at the top of the monitor display and printed signs.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Turnstile Mode</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCreateMode("auto")}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                    createMode === "auto"
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Auto-Detect
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMode("entry")}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                    createMode === "entry"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Entry Only
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMode("exit")}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                    createMode === "exit"
                      ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Exit Only
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !createName.trim()}
                className="rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                {isSubmitting ? "Registering..." : "Create Station"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT KIOSK DIALOG */}
      <Dialog open={!!editingKiosk} onOpenChange={(open) => !open && setEditingKiosk(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Kiosk Station</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Station Name</label>
              <Input
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Turnstile Mode</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setEditMode("auto")}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                    editMode === "auto"
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Auto-Detect
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode("entry")}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                    editMode === "entry"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Entry Only
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode("exit")}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                    editMode === "exit"
                      ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Exit Only
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Station Status</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditActive("true")}
                  className={`flex-1 p-2 rounded-xl border text-xs font-medium transition-all ${
                    editActive === "true"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  Active (Allow Check-Ins)
                </button>
                <button
                  type="button"
                  onClick={() => setEditActive("false")}
                  className={`flex-1 p-2 rounded-xl border text-xs font-medium transition-all ${
                    editActive === "false"
                      ? "border-red-500 bg-red-500/10 text-red-500 font-bold"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  Deactivated
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingKiosk(null)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !editName.trim()}
                className="rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PRINT STAND MODAL */}
      <Dialog open={!!printKiosk} onOpenChange={(open) => !open && setPrintKiosk(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Print Acrylic Desk Stand</DialogTitle>
          </DialogHeader>

          {printKiosk && (
            <div className="space-y-4 pt-2">
              {/* Stand Preview Container */}
              <div
                id="kiosk-print-area"
                className="bg-white text-zinc-950 p-6 rounded-2xl border-2 border-zinc-200 shadow-md text-center space-y-4 font-sans"
              >
                <div className="space-y-1">
                  <div className="inline-flex items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-black text-sm">
                      G
                    </div>
                    <span className="font-extrabold text-base tracking-tight uppercase">
                      {gym.name}
                    </span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-zinc-900 uppercase">
                    {printKiosk.name}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">
                    Self-Service Smart Check-In
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="p-3 bg-zinc-50 border-2 border-zinc-900 rounded-xl inline-block shadow-sm">
                  {/* Dynamic render image */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                      `${typeof window !== "undefined" ? window.location.origin : "https://gymerp-liard.vercel.app"}/portal/scan?kiosk=${printKiosk.slug}&token=${printKiosk.secretToken}&mode=${printKiosk.mode}`
                    )}`}
                    alt={printKiosk.name}
                    className="w-48 h-48 mx-auto object-contain"
                  />
                </div>

                {/* 3 Steps */}
                <div className="grid grid-cols-3 gap-2 text-left text-[10px] pt-1">
                  <div className="p-2 rounded-lg bg-zinc-100">
                    <span className="font-bold block text-zinc-900">1. Open Camera</span>
                    <span className="text-zinc-500">Scan QR Code</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-100">
                    <span className="font-bold block text-zinc-900">2. Verify Pass</span>
                    <span className="text-zinc-500">Instant Access</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-100">
                    <span className="font-bold block text-zinc-900">3. Walk Through</span>
                    <span className="text-zinc-500">Enjoy workout</span>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPrintKiosk(null)}
                  className="rounded-xl"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    window.print();
                  }}
                  className="rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Desk Stand</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
