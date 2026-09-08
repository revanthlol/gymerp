import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { members, membershipPlans, attendance, payments } from "@/lib/db/schema";
import { Users, QrCode, CreditCard, Sliders } from "lucide-react";

export const dynamic = "force-dynamic";

interface AdminDashboardData {
  members: Array<typeof members.$inferSelect>;
  plans: Array<typeof membershipPlans.$inferSelect>;
  attendance: Array<typeof attendance.$inferSelect>;
  payments: Array<typeof payments.$inferSelect>;
}

export default async function AdminDashboardPage() {
  const session = await getSession();

  // Query tenant-scoped operational data via withTenantDb
  const data: AdminDashboardData = await withTenantDb(session!, async (tx) => {
    const tenantMembers = await tx.select().from(members);
    const tenantPlans = await tx.select().from(membershipPlans);
    const tenantAttendance = await tx.select().from(attendance);
    const tenantPayments = await tx.select().from(payments);

    return {
      members: tenantMembers,
      plans: tenantPlans,
      attendance: tenantAttendance,
      payments: tenantPayments,
    };
  });

  const activeMembers = data.members.filter((m) => m.status === "active").length;
  const totalRevenue = data.payments.reduce(
    (acc, p) => acc + (p.status === "paid" ? parseFloat(p.amount) : 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Top Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gym Admin Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time membership metrics, daily turnstile check-ins, and active plans.
          </p>
        </div>
        <div className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>RLS Scoped: {session!.tenantId?.slice(0, 8)}...</span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Members</span>
            <Users className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{activeMembers}</p>
          <p className="text-xs text-zinc-500 font-mono">{data.members.length} total registered</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Today Check-Ins</span>
            <QrCode className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{data.attendance.length}</p>
          <p className="text-xs text-blue-400/90 font-mono">Front-desk turnstile</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Collected Revenue</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">${totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-emerald-400/90 font-mono">{data.payments.length} settlements</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Plans</span>
            <Sliders className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{data.plans.length}</p>
          <p className="text-xs text-zinc-500 font-mono">Configured tiers</p>
        </div>
      </div>

      {/* Membership Plans Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Configured Membership Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.plans.map((p) => (
            <div key={p.id} className="glass-panel p-5 rounded-2xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-base">{p.name}</h3>
                <span className="text-xs font-mono text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-800/40">
                  {p.durationDays} days
                </span>
              </div>
              <p className="text-xs text-zinc-400 min-h-[32px]">{p.description || "Standard pass"}</p>
              <div className="pt-2 border-t border-zinc-800 flex items-baseline justify-between">
                <p className="text-2xl font-bold text-white font-mono">${parseFloat(p.price).toFixed(2)}</p>
                <span className="text-[11px] text-zinc-500 font-mono">Admin Managed</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Members Overview Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Registered Athletes & Members</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Isolated within this gym&apos;s database partition</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-[11px] font-mono text-zinc-400 uppercase tracking-wider bg-zinc-900/50">
                <th className="py-3 px-5">Member Name</th>
                <th className="py-3 px-5">Phone</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">QR Token (Kiosk Pass)</th>
                <th className="py-3 px-5">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-sm">
              {data.members.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-white flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold">
                      {m.fullName.charAt(0)}
                    </div>
                    <span>{m.fullName}</span>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs text-zinc-300">{m.phone}</td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.status === "active"
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/50"
                          : "bg-red-950/40 text-red-400 border border-red-800/50"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs text-zinc-400">
                    <span className="bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                      {m.qrToken.slice(0, 8)}...
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs text-zinc-400">
                    {m.joinDate ? new Date(m.joinDate).toLocaleDateString() : "—"}
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
