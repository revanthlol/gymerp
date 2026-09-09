"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { provisionTenantAction } from "@/lib/api/tenants";
import { Plus, Loader2, CheckCircle2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function CreateTenantDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    tenant: any;
    inviteLink: string;
    tempPassword?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    contactEmail: "",
    phone: "",
    adminFullName: "",
    initialStatus: "active" as "active" | "trial",
    licenseDurationDays: 365,
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await provisionTenantAction(formData);
      setResult(res);
      toast.success(`Gym "${res.tenant.name}" provisioned successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to provision gym tenant");
    } finally {
      setLoading(false);
    }
  };

  const copyInvite = () => {
    if (result?.inviteLink) {
      navigator.clipboard.writeText(result.inviteLink);
      setCopied(true);
      toast.info("Invite link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setResult(null);
    setFormData({
      name: "",
      slug: "",
      contactEmail: "",
      phone: "",
      adminFullName: "",
      initialStatus: "active",
      licenseDurationDays: 365,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button className="glow-bottom gap-2 font-medium shadow-[0_0_20px_rgba(255,94,30,0.3)]">
          <Plus className="w-4 h-4" />
          <span>Provision New Gym</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {result ? "Tenant Provisioned" : "Provision New Gym Account"}
          </DialogTitle>
          <DialogDescription>
            {result
              ? "The gym and its primary administrator account have been created."
              : "Set up a new isolated gym workspace and generate its primary admin credentials."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Tenant & Admin Account Created</span>
              </div>
              <p className="text-xs text-zinc-300">
                Gym: <strong className="text-white">{result.tenant.name}</strong> ({result.tenant.slug})
              </p>
              <p className="text-xs text-zinc-300">
                Admin: <strong className="text-white">{result.tenant.contactEmail}</strong>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-zinc-400 uppercase">
                Admin Onboarding Link
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={result.inviteLink}
                  className="font-mono text-xs bg-zinc-900 select-all"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyInvite}
                  title="Copy Link"
                  className="shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Send this link to the gym owner to set their password and access their dashboard.
              </p>
            </div>

            <Button
              className="w-full mt-2"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Gym Name</label>
              <Input
                required
                placeholder="e.g., Apex Martial Arts"
                value={formData.name}
                onChange={handleNameChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Workspace Slug</label>
                <Input
                  required
                  placeholder="apex-martial-arts"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">License Term</label>
                <select
                  value={formData.licenseDurationDays}
                  onChange={(e) =>
                    setFormData({ ...formData, licenseDurationDays: Number(e.target.value) })
                  }
                  className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500/50"
                >
                  <option value={30}>30 Days (Trial)</option>
                  <option value={90}>90 Days (Quarterly)</option>
                  <option value={365}>365 Days (Annual)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Admin Full Name</label>
                <Input
                  required
                  placeholder="e.g., Sarah Connor"
                  value={formData.adminFullName}
                  onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Contact Phone</label>
                <Input
                  required
                  placeholder="+1 (555) 019-2834"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Admin Email Address</label>
              <Input
                type="email"
                required
                placeholder="owner@apexmartialarts.com"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
              <p className="text-[11px] text-zinc-500">
                This email will be provisioned in Firebase Auth as the tenant administrator.
              </p>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={loading} className="w-full glow-bottom">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Provisioning Tenant...</span>
                  </>
                ) : (
                  <span>Create Tenant & Admin</span>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
