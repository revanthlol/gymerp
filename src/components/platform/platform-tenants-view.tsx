"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CreateTenantDialog } from "@/components/platform/create-tenant-dialog";
import {
  toggleTenantStatusAction,
  extendTenantLicenseAction,
  resetTenantAdminPasswordAction,
  deleteTenantAction,
} from "@/lib/api/tenants";
import {
  Search,
  Building2,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  CalendarPlus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "trial" | string;
  contactEmail: string | null;
  phone: string | null;
  licenseExpiresAt: Date | string | null;
  createdAt: Date | string | null;
}

interface PlatformTenantsViewProps {
  initialTenants: TenantRecord[];
}

export function PlatformTenantsView({ initialTenants }: PlatformTenantsViewProps) {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantRecord[]>(initialTenants);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTenants(initialTenants);
  }, [initialTenants]);

  // Dialog states for superadmin actions
  const [licenseModalTenant, setLicenseModalTenant] = useState<TenantRecord | null>(null);
  const [passwordModalTenant, setPasswordModalTenant] = useState<TenantRecord | null>(null);
  const [deleteModalTenant, setDeleteModalTenant] = useState<TenantRecord | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState("");

  // Password reset result
  const [resetResult, setResetResult] = useState<{
    email: string;
    newPassword?: string;
    resetLink?: string;
  } | null>(null);
  const [customResetPassword, setCustomResetPassword] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(search.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(search.toLowerCase()) ||
      (tenant.contactEmail &&
        tenant.contactEmail.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ? true : tenant.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusToggle = (tenant: TenantRecord) => {
    const newStatus = tenant.status === "suspended" ? "active" : "suspended";

    setPendingId(tenant.id);
    startTransition(async () => {
      try {
        await toggleTenantStatusAction(tenant.id, newStatus);
        setTenants((prev) =>
          prev.map((t) => (t.id === tenant.id ? { ...t, status: newStatus } : t))
        );
        router.refresh();
        toast.success(
          `Tenant "${tenant.name}" ${
            newStatus === "suspended"
              ? "suspended & sessions revoked"
              : "activated successfully"
          }`
        );
      } catch (err: any) {
        toast.error(err.message || "Failed to update tenant status");
      } finally {
        setPendingId(null);
      }
    });
  };

  const handleExtendLicense = (days: number) => {
    if (!licenseModalTenant) return;
    const targetId = licenseModalTenant.id;
    setPendingId(targetId);

    startTransition(async () => {
      try {
        const res = await extendTenantLicenseAction(targetId, days);
        if (!res.success) throw new Error(res.error);
        setTenants((prev) =>
          prev.map((t) => {
            if (t.id !== targetId) return t;
            const currentExpiry = t.licenseExpiresAt ? new Date(t.licenseExpiresAt) : new Date();
            const nextExpiry =
              days === -1
                ? new Date(Date.now() + 100 * 365 * 24 * 3600 * 1000)
                : new Date(currentExpiry.getTime() + days * 24 * 3600 * 1000);
            return { ...t, licenseExpiresAt: nextExpiry };
          })
        );
        router.refresh();
        toast.success(`License extended for ${licenseModalTenant.name}`);
        setLicenseModalTenant(null);
      } catch (err: any) {
        toast.error(err.message || "Failed to extend license");
      } finally {
        setPendingId(null);
      }
    });
  };

  const handleResetPassword = () => {
    if (!passwordModalTenant) return;
    const targetId = passwordModalTenant.id;
    setPendingId(targetId);

    startTransition(async () => {
      try {
        const res = await resetTenantAdminPasswordAction(
          targetId,
          customResetPassword.trim() || undefined
        );
        if (!res.success) throw new Error(res.error);
        setResetResult(res as any);
        toast.success("Admin password reset generated successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to reset password");
      } finally {
        setPendingId(null);
      }
    });
  };

  const handleDeleteTenant = () => {
    if (!deleteModalTenant) return;
    if (confirmDeleteName.trim().toLowerCase() !== deleteModalTenant.name.trim().toLowerCase()) {
      toast.error("Please type the exact gym name to confirm deletion");
      return;
    }

    const targetId = deleteModalTenant.id;
    setPendingId(targetId);

    startTransition(async () => {
      try {
        const res = await deleteTenantAction(targetId);
        if (!res.success) throw new Error(res.error);
        setTenants((prev) => prev.filter((t) => t.id !== targetId));
        router.refresh();
        toast.success(`Tenant ${deleteModalTenant.name} and all data successfully purged.`);
        setDeleteModalTenant(null);
        setConfirmDeleteName("");
      } catch (err: any) {
        toast.error(err.message || "Failed to delete tenant");
      } finally {
        setPendingId(null);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "trial":
        return <Badge variant="warning">Trial</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search gym by name, slug, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl bg-card border-input text-foreground text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border text-xs">
            {["all", "active", "trial", "suspended"].map((filter) => {
              const active = statusFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          <CreateTenantDialog
            onTenantCreated={(newTenant) => {
              setTenants((prev) => [newTenant, ...prev]);
            }}
          />
        </div>
      </div>

      {/* Tenants Table Card */}
      <div className="rounded-2xl overflow-hidden border border-border bg-card/85 backdrop-blur-xl shadow-xs">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Registered Gym Tenants</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Superadmin fleet management &middot; Total: {filteredTenants.length}
            </p>
          </div>
          <div className="text-xs font-medium text-muted-foreground px-3 py-1 rounded-xl bg-muted/60 border border-border">
            Platform Master Tier
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
              <TableHead>Gym Name</TableHead>
              <TableHead>Workspace Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Admin Account</TableHead>
              <TableHead>License Validity</TableHead>
              <TableHead className="text-right">Superadmin Controls</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Building2 className="w-8 h-8 text-muted-foreground/60" />
                    <span>No gym tenants match your criteria</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTenants.map((tenant) => {
                const isProcessing = isPending && pendingId === tenant.id;

                return (
                  <TableRow key={tenant.id} className="hover:bg-muted/30 transition-colors border-b border-border/60">
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0 shadow-xs">
                          {tenant.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{tenant.name}</p>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            ID: {tenant.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <span className="bg-muted/70 px-2 py-0.5 rounded-lg border border-border text-foreground">
                        {tenant.slug}
                      </span>
                    </TableCell>

                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>

                    <TableCell className="text-xs text-foreground">
                      <p className="font-medium">{tenant.contactEmail || "—"}</p>
                      <p className="text-muted-foreground font-mono text-[11px]">{tenant.phone || "—"}</p>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {tenant.licenseExpiresAt ? (
                        <span
                          className={
                            new Date(tenant.licenseExpiresAt) < new Date()
                              ? "text-red-500 font-semibold"
                              : "text-foreground"
                          }
                        >
                          {new Date(tenant.licenseExpiresAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Lifetime</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Extend License Trigger */}
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Extend License Duration"
                          onClick={() => setLicenseModalTenant(tenant)}
                          className="h-8 px-2 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg cursor-pointer"
                        >
                          <CalendarPlus className="w-4 h-4 text-emerald-500" />
                        </Button>

                        {/* Reset Password Trigger */}
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Reset Admin Credentials"
                          onClick={() => {
                            setPasswordModalTenant(tenant);
                            setResetResult(null);
                            setCustomResetPassword("");
                          }}
                          className="h-8 px-2 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-lg cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-amber-500" />
                        </Button>

                        {/* Open Gym Kiosk in New Tab */}
                        <a
                          href="/staff/kiosk?mode=auto"
                          target="_blank"
                          rel="noreferrer"
                          title="Launch Gym Live Kiosk"
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-sky-500" />
                        </a>

                        {/* Status Toggle (Suspend / Activate) */}
                        {tenant.status === "suspended" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isProcessing}
                            onClick={() => handleStatusToggle(tenant)}
                            className="h-8 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 gap-1 border border-emerald-500/20 bg-emerald-500/10 rounded-xl cursor-pointer"
                          >
                            {isProcessing ? (
                              <Spinner size="xs" className="text-emerald-500" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">Activate</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isProcessing}
                            onClick={() => handleStatusToggle(tenant)}
                            className="h-8 text-xs text-destructive hover:bg-destructive/15 gap-1 border border-destructive/20 bg-destructive/10 rounded-xl cursor-pointer"
                          >
                            {isProcessing ? (
                              <Spinner size="xs" className="text-destructive" />
                            ) : (
                              <ShieldAlert className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">Suspend</span>
                          </Button>
                        )}

                        {/* Delete Tenant Trigger */}
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Purge / Delete Tenant"
                          onClick={() => {
                            setDeleteModalTenant(tenant);
                            setConfirmDeleteName("");
                          }}
                          className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 1. EXTEND LICENSE DIALOG */}
      <Dialog
        open={Boolean(licenseModalTenant)}
        onOpenChange={(open) => !open && setLicenseModalTenant(null)}
      >
        <DialogContent className="max-w-md rounded-2xl bg-card/95 backdrop-blur-2xl border border-border/80 text-foreground p-6 shadow-2xl">
          <DialogHeader className="p-0 border-none">
            <DialogTitle className="flex items-center gap-2 text-foreground font-semibold text-base">
              <CalendarPlus className="w-5 h-5 text-emerald-500" />
              <span>Extend License Duration</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Add subscription validity for <strong className="text-foreground">{licenseModalTenant?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground">
              Current Expiry:{" "}
              <strong className="text-foreground">
                {licenseModalTenant?.licenseExpiresAt
                  ? new Date(licenseModalTenant.licenseExpiresAt).toLocaleDateString()
                  : "Lifetime"}
              </strong>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                onClick={() => handleExtendLicense(30)}
                disabled={isPending}
                className="h-10 text-xs font-semibold rounded-xl border-border hover:bg-muted/80"
              >
                +30 Days (1 Mo)
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExtendLicense(90)}
                disabled={isPending}
                className="h-10 text-xs font-semibold rounded-xl border-border hover:bg-muted/80"
              >
                +90 Days (3 Mo)
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExtendLicense(365)}
                disabled={isPending}
                className="h-10 text-xs font-semibold rounded-xl border-border hover:bg-muted/80"
              >
                +1 Year (365 Days)
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExtendLicense(-1)}
                disabled={isPending}
                className="h-10 text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl"
              >
                Grant Lifetime Access
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. RESET ADMIN CREDENTIALS DIALOG */}
      <Dialog
        open={Boolean(passwordModalTenant)}
        onOpenChange={(open) => !open && setPasswordModalTenant(null)}
      >
        <DialogContent className="max-w-md rounded-2xl bg-card/95 backdrop-blur-2xl border border-border/80 text-foreground p-6 shadow-2xl">
          <DialogHeader className="p-0 border-none">
            <DialogTitle className="flex items-center gap-2 text-foreground font-semibold text-base">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>Reset Gym Admin Password</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Change the password or generate a reset link for{" "}
              <strong className="text-foreground">{passwordModalTenant?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {resetResult ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
                <div>
                  <label className="text-[11px] text-muted-foreground font-medium">Admin Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      readOnly
                      value={resetResult.email}
                      className="font-mono text-xs bg-background text-foreground select-all h-9 rounded-xl border-border"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 shrink-0 rounded-xl border-border"
                      onClick={() => copyToClipboard(resetResult.email, "email")}
                    >
                      {copiedKey === "email" ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {resetResult.newPassword && (
                  <div>
                    <label className="text-[11px] text-muted-foreground font-medium">New Password</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        readOnly
                        value={resetResult.newPassword}
                        className="font-mono text-xs bg-background text-emerald-600 dark:text-emerald-400 select-all h-9 font-semibold rounded-xl border-border"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 shrink-0 rounded-xl border-border"
                        onClick={() => copyToClipboard(resetResult.newPassword!, "password")}
                      >
                        {copiedKey === "password" ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {resetResult.resetLink && (
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-medium">Direct Password Reset Link</label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={resetResult.resetLink}
                      className="font-mono text-xs bg-background border-border select-all h-9 text-muted-foreground rounded-xl"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 shrink-0 rounded-xl border-border"
                      onClick={() => copyToClipboard(resetResult.resetLink!, "link")}
                    >
                      {copiedKey === "link" ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <Button
                className="w-full rounded-xl"
                onClick={() => setPasswordModalTenant(null)}
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Custom Password (Optional)
                </label>
                <Input
                  placeholder="Leave empty to auto-generate a secure password"
                  value={customResetPassword}
                  onChange={(e) => setCustomResetPassword(e.target.value)}
                  className="font-mono text-xs rounded-xl bg-background"
                />
                <p className="text-[11px] text-muted-foreground">
                  Must be at least 6 characters if specified.
                </p>
              </div>

              <Button
                className="w-full rounded-xl"
                disabled={isPending}
                onClick={handleResetPassword}
              >
                {isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    <span>Resetting credentials...</span>
                  </>
                ) : (
                  <span>Confirm Password Reset</span>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 3. DELETE TENANT CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(deleteModalTenant)}
        onOpenChange={(open) => !open && setDeleteModalTenant(null)}
      >
        <DialogContent className="max-w-md rounded-2xl bg-card/95 backdrop-blur-2xl border border-destructive/30 text-foreground p-6 shadow-2xl">
          <DialogHeader className="p-0 border-none">
            <DialogTitle className="flex items-center gap-2 text-destructive font-semibold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Purge Gym Tenant</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1 leading-relaxed">
              This action is permanent and will cascade-delete all members, memberships, attendance logs, and staff accounts for <strong className="text-foreground">{deleteModalTenant?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive space-y-1">
              <p className="font-semibold">Destructive Action:</p>
              <p className="text-muted-foreground">
                To confirm, type the exact gym name:{" "}
                <strong className="text-foreground select-all">{deleteModalTenant?.name}</strong>
              </p>
            </div>

            <Input
              placeholder={deleteModalTenant?.name}
              value={confirmDeleteName}
              onChange={(e) => setConfirmDeleteName(e.target.value)}
              className="rounded-xl text-xs bg-background"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteModalTenant(null)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={
                  isPending ||
                  confirmDeleteName.trim().toLowerCase() !==
                    deleteModalTenant?.name.trim().toLowerCase()
                }
                onClick={handleDeleteTenant}
                className="text-xs font-semibold rounded-xl gap-1.5"
              >
                {isPending ? (
                  <>
                    <Spinner size="xs" variant="current" />
                    <span>Purging...</span>
                  </>
                ) : (
                  <span>Permanently Delete Gym</span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
