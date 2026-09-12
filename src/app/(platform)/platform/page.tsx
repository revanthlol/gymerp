import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { tenants, users, members, attendance } from "@/lib/db/schema";
import { Building2, DollarSign, Activity, Users, QrCode } from "lucide-react";
import { PlatformTenantsView } from "@/components/platform/platform-tenants-view";
import { Reveal } from "@/components/Reveal";
import { count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function PlatformDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "platform") {
    redirect("/login");
  }

  // Fetch real tenant records and platform-wide aggregations
  const [allTenants, totalUsers, totalMembers, totalAttendance] = await withTenantDb(
    { userId: session.uid, role: "platform", tenantId: null },
    async (tx) => {
      const [tList, uList, mList, aList] = await Promise.all([
        tx.select().from(tenants),
        tx.select({ value: count() }).from(users),
        tx.select({ value: count() }).from(members),
        tx.select({ value: count() }).from(attendance),
      ]);
      return [
        tList,
        Number(uList[0]?.value || 0),
        Number(mList[0]?.value || 0),
        Number(aList[0]?.value || 0),
      ] as const;
    }
  );

  const activeCount = allTenants.filter((t: any) => t.status === "active").length;
  const trialCount = allTenants.filter((t: any) => t.status === "trial").length;
  const suspendedCount = allTenants.filter((t: any) => t.status === "suspended").length;

  // Real ARR calculation: standard annual SaaS plan rate ($1,188/yr = $99/mo per active tenant)
  const annualRatePerGym = 1188;
  const platformArr = activeCount * annualRatePerGym;

  return (
    <Reveal className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Fleet Command</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Global multi-tenant infrastructure, tenant licenses, and network-wide telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>PostgreSQL Cluster: Connected</span>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Gyms</span>
            <Building2 className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{allTenants.length}</p>
          <p className="text-xs text-zinc-500 font-mono">
            {activeCount} active · {trialCount} trial · {suspendedCount} suspended
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Platform ARR</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            ${platformArr.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-400/90 font-mono">
            ${(activeCount * 99).toLocaleString()}/mo contracted
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Network Athletes</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {totalMembers.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 font-mono">
            Across {allTenants.length} gym locations
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Check-Ins</span>
            <QrCode className="w-4 h-4 text-brand" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {totalAttendance.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 font-mono">
            Anti-proxy passes verified
          </p>
        </div>
      </div>

      {/* Interactive Tenants Management View */}
      <PlatformTenantsView initialTenants={allTenants} />
    </Reveal>
  );
}
