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
import { CreateTenantDialog } from "@/components/platform/create-tenant-dialog";
import { toggleTenantStatusAction } from "@/lib/api/tenants";
import { Search, Building2, ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
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
    const newStatus =
      tenant.status === "suspended" ? "active" : "suspended";

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
              Live records queried via PostgreSQL Drizzle client · Total: {filteredTenants.length}
            </p>
          </div>
          <div className="text-xs font-mono text-zinc-400 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
            RLS: platform_manages_tenants
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-900/50">
              <TableHead>Gym Name</TableHead>
              <TableHead>Workspace Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contact Admin</TableHead>
              <TableHead>License Expiration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                      <p>{tenant.contactEmail || "—"}</p>
                      <p className="text-zinc-500 font-mono text-[11px]">{tenant.phone || "—"}</p>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-zinc-400">
                      {tenant.licenseExpiresAt
                        ? new Date(tenant.licenseExpiresAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Lifetime"}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {tenant.status === "suspended" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isProcessing}
                            onClick={() => handleStatusToggle(tenant)}
                            className="h-8 text-xs text-emerald-400 hover:text-emerald-300 gap-1.5 border border-emerald-800/40 bg-emerald-950/20"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            )}
                            <span>Activate</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isProcessing}
                            onClick={() => handleStatusToggle(tenant)}
                            className="h-8 text-xs text-red-400 hover:text-red-300 gap-1.5 border border-red-800/40 bg-red-950/20"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ShieldAlert className="w-3.5 h-3.5" />
                            )}
                            <span>Suspend</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
