"use client";

import React, { useState, useTransition } from "react";
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
  Loader2,
  KeyRound,
  CalendarPlus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  const filteredTenants = initialTenants.filter((tenant) => {
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
        toast.success(
          days === -1
            ? `Granted lifetime license to ${licenseModalTenant.name}`
            : `Extended license by ${days} days for ${licenseModalTenant.name}`
        );
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
        setResetResult({
          email: res.adminEmail || passwordModalTenant.contactEmail || "",
          newPassword: res.newPassword,
          resetLink: res.resetLink,
        });
        toast.success(`Admin credentials updated for ${passwordModalTenant.name}`);
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
      toast.error("Gym name does not match. Purge cancelled.");
      return;
    }

    const targetId = deleteModalTenant.id;
    setPendingId(targetId);

    startTransition(async () => {
      try {
        const res = await deleteTenantAction(targetId);
        if (!res.success) throw new Error(res.error);
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search gym by name, slug, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-zinc-950/60"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center rounded-xl bg-zinc-900/80 p-1 border border-zinc-800 text-xs">
            {["all", "active", "trial", "suspended"].map((filter) => {
              const active = statusFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors ${
                    active
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          <CreateTenantDialog />
        </div>
      </div>

      {/* Tenants Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800/80">
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Registered Gym Tenants</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Superadmin fleet management · Total: {filteredTenants.length}
            </p>
          </div>
          <div className="text-xs text-zinc-400 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
            Platform Master Tier
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-900/50">
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
                <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Building2 className="w-8 h-8 text-zinc-600" />
                    <span>No gym tenants match your criteria</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTenants.map((tenant) => {
                const isProcessing = isPending && pendingId === tenant.id;

                return (
                  <TableRow key={tenant.id} className="hover:bg-zinc-800/30">
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center text-xs font-bold text-zinc-200 shrink-0">
                          {tenant.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{tenant.name}</p>
                          <p className="text-[11px] font-mono text-zinc-500">
                            ID: {tenant.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-zinc-300">
                      <span className="bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800">
                        {tenant.slug}
                      </span>
                    </TableCell>

                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>

                    <TableCell className="text-xs text-zinc-300">
                      <p className="font-medium">{tenant.contactEmail || "—"}</p>
                      <p className="text-zinc-500 font-mono text-[11px]">{tenant.phone || "—"}</p>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-zinc-400">
                      {tenant.licenseExpiresAt ? (
                        <span
                          className={
                            new Date(tenant.licenseExpiresAt) < new Date()
                              ? "text-red-400 font-semibold"
                              : "text-zinc-300"
                          }
                        >
                          {new Date(tenant.licenseExpiresAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Lifetime</span>
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
                          className="h-8 px-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80"
                        >
                          <CalendarPlus className="w-4 h-4 text-emerald-400" />
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
                          className="h-8 px-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80"
                        >
                          <KeyRound className="w-4 h-4 text-amber-400" />
                        </Button>

                        {/* Open Gym Kiosk in New Tab */}
                        <a
                          href="/staff/kiosk?mode=auto"
                          target="_blank"
                          rel="noreferrer"
                          title="Launch Gym Live Kiosk"
                          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-cyan-400" />
                        </a>

                        {/* Status Toggle (Suspend / Activate) */}
                        {tenant.status === "suspended" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isProcessing}
                            onClick={() => handleStatusToggle(tenant)}
                            className="h-8 text-xs text-emerald-400 hover:text-emerald-300 gap-1 border border-emerald-800/40 bg-emerald-950/20"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
                            className="h-8 text-xs text-red-400 hover:text-red-300 gap-1 border border-red-800/40 bg-red-950/20"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
                          className="h-8 px-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/20"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <CalendarPlus className="w-5 h-5 text-emerald-400" />
              <span>Extend License Duration</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Add subscription validity for <strong>{licenseModalTenant?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              Current Expiry:{" "}
              <strong className="text-white">
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
                className="h-10 text-xs font-semibold border-zinc-800 hover:border-emerald-500/40 hover:bg-emerald-500/10"
              >
                +30 Days (1 Mo)
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExtendLicense(90)}
                disabled={isPending}
                className="h-10 text-xs font-semibold border-zinc-800 hover:border-emerald-500/40 hover:bg-emerald-500/10"
              >
                +90 Days (3 Mo)
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExtendLicense(365)}
                disabled={isPending}
                className="h-10 text-xs font-semibold border-zinc-800 hover:border-emerald-500/40 hover:bg-emerald-500/10"
              >
                +1 Year (365 Days)
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExtendLicense(-1)}
                disabled={isPending}
                className="h-10 text-xs font-bold text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <span>Reset Gym Admin Password</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Change the password or generate a reset link for{" "}
              <strong>{passwordModalTenant?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {resetResult ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div>
                  <label className="text-[11px] text-zinc-400">Admin Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      readOnly
                      value={resetResult.email}
                      className="font-mono text-xs bg-zinc-950 text-white select-all h-9"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 shrink-0"
                      onClick={() => copyToClipboard(resetResult.email, "email")}
                    >
                      {copiedKey === "email" ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-zinc-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {resetResult.newPassword && (
                  <div>
                    <label className="text-[11px] text-zinc-400">New Password</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        readOnly
                        value={resetResult.newPassword}
                        className="font-mono text-xs bg-zinc-950 text-emerald-400 select-all h-9 font-semibold"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 shrink-0"
                        onClick={() => copyToClipboard(resetResult.newPassword!, "password")}
                      >
                        {copiedKey === "password" ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-zinc-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {resetResult.resetLink && (
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Direct Password Reset Link</label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={resetResult.resetLink}
                      className="font-mono text-xs bg-zinc-900 select-all h-9 text-zinc-400"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 shrink-0"
                      onClick={() => copyToClipboard(resetResult.resetLink!, "link")}
                    >
                      {copiedKey === "link" ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-zinc-400" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-primary text-[#08090a] hover:bg-primary-deep font-semibold"
                onClick={() => setPasswordModalTenant(null)}
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Custom Password (Optional)
                </label>
                <Input
                  placeholder="Leave empty to auto-generate a secure password"
                  value={customResetPassword}
                  onChange={(e) => setCustomResetPassword(e.target.value)}
                  className="font-mono text-xs bg-zinc-950"
                />
                <p className="text-[11px] text-zinc-500">
                  Must be at least 6 characters if specified.
                </p>
              </div>

              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                disabled={isPending}
                onClick={handleResetPassword}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
        <DialogContent className="max-w-md border-red-900/40">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Purge Gym Tenant</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              This action is permanent and will cascade-delete all members, memberships, attendance logs, and staff accounts for <strong>{deleteModalTenant?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/40 text-xs text-red-300 space-y-1">
              <p className="font-semibold">Destructive Action:</p>
              <p className="text-zinc-400">
                To confirm, type the exact gym name:{" "}
                <strong className="text-white select-all">{deleteModalTenant?.name}</strong>
              </p>
            </div>

            <Input
              placeholder={deleteModalTenant?.name}
              value={confirmDeleteName}
              onChange={(e) => setConfirmDeleteName(e.target.value)}
              className="bg-zinc-950 text-xs"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setDeleteModalTenant(null)}
                className="text-xs text-zinc-400 hover:text-white"
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
                className="text-xs font-semibold"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
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
