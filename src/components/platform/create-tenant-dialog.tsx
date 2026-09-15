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
import { useRouter } from "next/navigation";
import { Plus, CheckCircle2, Copy, Check } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface CreateTenantDialogProps {
  onTenantCreated?: (newTenant: any) => void;
}

export function CreateTenantDialog({ onTenantCreated }: CreateTenantDialogProps = {}) {
  const router = useRouter();
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
    adminPassword: "",
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
      if (!res.success) {
        toast.error(res.error || "Failed to provision gym tenant");
        return;
      }
      setResult(res as any);
      if (res.tenant) {
        onTenantCreated?.(res.tenant);
      }
      router.refresh();
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
      adminPassword: "",
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
        <Button className="rounded-xl gap-2 font-medium shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Provision New Gym</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl bg-card/95 backdrop-blur-2xl border border-border/80 text-foreground p-6 shadow-2xl">
        <DialogHeader className="p-0 border-none">
          <DialogTitle className="text-lg font-bold text-foreground">
            {result ? "Tenant Provisioned" : "Provision New Gym Account"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {result
              ? "The gym and its primary administrator account have been created."
              : "Set up a new isolated gym workspace and generate its primary admin credentials."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Gym Workspace & Admin Account Created</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Gym: <strong className="text-foreground">{result.tenant.name}</strong> ({result.tenant.slug})
              </p>
            </div>

            {/* Credentials Card */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">
                Gym Admin Sign-In Credentials
              </span>

              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-medium">Admin Email</label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={result.tenant.contactEmail}
                      className="font-mono text-xs bg-background text-foreground select-all h-9 rounded-xl border-border"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 shrink-0 rounded-xl border-border hover:bg-muted/80"
                      onClick={() => {
                        navigator.clipboard.writeText(result.tenant.contactEmail);
                        toast.success("Email copied to clipboard");
                      }}
                      title="Copy Email"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {result.tempPassword && (
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground font-medium">Initial Password</label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={result.tempPassword}
                        className="font-mono text-xs bg-background text-emerald-600 dark:text-emerald-400 select-all h-9 font-semibold rounded-xl border-border"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 shrink-0 rounded-xl border-border hover:bg-muted/80"
                        onClick={() => {
                          navigator.clipboard.writeText(result.tempPassword!);
                          toast.success("Password copied to clipboard");
                        }}
                        title="Copy Password"
                      >
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary flex items-center justify-between">
                <span>Sign-In Portal: <strong>/login</strong></span>
                <a
                  href="/login"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  Open Portal →
                </a>
              </div>
            </div>

            {/* Onboarding Password Reset Link */}
            {result.inviteLink && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-muted-foreground uppercase">
                  Alternative: Direct Password Reset Link
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={result.inviteLink}
                    className="font-mono text-xs bg-background border-border select-all h-9 text-muted-foreground rounded-xl"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 shrink-0 rounded-xl border-border hover:bg-muted/80"
                    onClick={copyInvite}
                    title="Copy Link"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  You can send this link to the gym owner so they can set a personalized password.
                </p>
              </div>
            )}

            <Button
              className="w-full mt-2 rounded-xl"
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
              <label className="text-xs font-medium text-foreground">Gym Name</label>
              <Input
                required
                placeholder="e.g., Apex Martial Arts"
                value={formData.name}
                onChange={handleNameChange}
                className="rounded-xl text-xs bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Workspace Slug</label>
                <Input
                  required
                  placeholder="apex-martial-arts"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="rounded-xl text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">License Term</label>
                <select
                  value={formData.licenseDurationDays}
                  onChange={(e) =>
                    setFormData({ ...formData, licenseDurationDays: Number(e.target.value) })
                  }
                  className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value={30}>30 Days (Trial)</option>
                  <option value={90}>90 Days (Quarterly)</option>
                  <option value={365}>365 Days (Annual)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Admin Full Name</label>
                <Input
                  required
                  placeholder="e.g., Sarah Connor"
                  value={formData.adminFullName}
                  onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                  className="rounded-xl text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Contact Phone</label>
                <Input
                  required
                  placeholder="+1 (555) 019-2834"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="rounded-xl text-xs bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Admin Email Address</label>
              <Input
                type="email"
                required
                placeholder="owner@apexmartialarts.com"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="rounded-xl text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Initial Admin Password (Optional)</label>
                <span className="text-[10px] text-muted-foreground">Min 6 chars</span>
              </div>
              <Input
                type="text"
                placeholder="Leave blank to auto-generate a secure password"
                value={formData.adminPassword || ""}
                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                className="font-mono text-xs rounded-xl bg-background"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={loading} className="w-full rounded-xl">
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
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
