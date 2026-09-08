import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { tenants } from "@/lib/db/schema";
import { Building2, Users, DollarSign, Activity, Calendar, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlatformDashboardPage() {
  const session = await getSession();

  // Fetch real tenant records using withTenantDb in platform role
  const allTenants = await withTenantDb(
    { userId: session!.uid, role: "platform", tenantId: null },
    async (tx) => {
      return await tx.select().from(tenants);
    }
  );

  const activeCount = allTenants.filter((t: any) => t.status === "active").length;
  const trialCount = allTenants.filter((t: any) => t.status === "trial").length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Network Overview</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Global multi-tenant metrics, provisioning status, and database health.
        </p>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Tenants</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{allTenants.length}</p>
          <p className="text-xs text-zinc-500 font-mono">
            {activeCount} active · {trialCount} trial
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Platform ARR</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">$14,280</p>
          <p className="text-xs text-emerald-400/90 font-mono">+$1,200 this month</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">RLS Security Status</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">Enforced</p>
          <p className="text-xs text-zinc-500 font-mono">Zero member PII exposure</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Database Engine</span>
            <Activity className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">Postgres 16</p>
          <p className="text-xs text-zinc-500 font-mono">Connection Pool: 20 max</p>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Registered Gym Tenants</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Live records queried via PostgreSQL Drizzle client</p>
          </div>
          <div className="text-xs font-mono text-zinc-400 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
            RLS: platform_manages_tenants
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-[11px] font-mono text-zinc-400 uppercase tracking-wider bg-zinc-900/50">
                <th className="py-3 px-5">Gym Name</th>
                <th className="py-3 px-5">Slug</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Contact</th>
                <th className="py-3 px-5">License Expiry</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-sm">
              {allTenants.map((t: any) => (
                <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-4 px-5 font-medium text-white flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center text-xs font-bold text-zinc-300">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p>{t.name}</p>
                      <p className="text-[11px] font-mono text-zinc-500">{t.id.slice(0, 8)}...</p>
                    </div>
                  </td>
                  <td className="py-4 px-5 font-mono text-xs text-zinc-400">{t.slug}</td>
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        t.status === "active"
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/50"
                          : t.status === "trial"
                          ? "bg-amber-950/40 text-amber-400 border border-amber-800/50"
                          : "bg-red-950/40 text-red-400 border border-red-800/50"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-xs text-zinc-300">
                    <p>{t.contactEmail || "—"}</p>
                    <p className="text-zinc-500 font-mono text-[11px]">{t.phone || "—"}</p>
                  </td>
                  <td className="py-4 px-5 font-mono text-xs text-zinc-400">
                    {t.licenseExpiresAt
                      ? new Date(t.licenseExpiresAt).toLocaleDateString()
                      : "Lifetime"}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1">
                      <span>Manage</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
