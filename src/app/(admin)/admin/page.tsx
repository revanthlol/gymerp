import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { members, membershipPlans, attendance, payments } from "@/lib/db/schema";
import { Users, QrCode, CreditCard, Sliders, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TurnstileQrDialog } from "@/components/admin/turnstile-qr-dialog";

export const dynamic = "force-dynamic";

interface AdminDashboardData {
  members: Array<typeof members.$inferSelect>;
  plans: Array<typeof membershipPlans.$inferSelect>;
  attendance: Array<typeof attendance.$inferSelect>;
  payments: Array<typeof payments.$inferSelect>;
}

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  // Query tenant-scoped operational data via withTenantDb in parallel
  const data: AdminDashboardData = await withTenantDb(session, async (tx) => {
    const [tenantMembers, tenantPlans, tenantAttendance, tenantPayments] =
      await Promise.all([
        tx.select().from(members),
        tx.select().from(membershipPlans),
        tx.select().from(attendance),
        tx.select().from(payments),
      ]);

    return {
      members: tenantMembers,
      plans: tenantPlans,
      attendance: tenantAttendance,
      payments: tenantPayments,
    };
  });

  if (data.plans.length === 0) {
    redirect("/admin/onboarding");
  }

  const activeMembers = data.members.filter((m) => m.status === "active").length;
  const inactiveMembers = data.members.length - activeMembers;
  const totalRevenue = data.payments.reduce(
    (acc, p) => acc + (p.status === "paid" ? parseFloat(p.amount) : 0),
    0
  );

  return (
    <Reveal className="space-y-8">
      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gym Admin Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time membership metrics, daily member check-ins, and active plans.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/onboarding">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 bg-[#0c0d10] border-white/[0.08] text-zinc-300 hover:text-white rounded-lg flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-primary" />
              <span>Facility Setup Wizard</span>
            </Button>
          </Link>
          <TurnstileQrDialog />
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-lg space-y-2 border border-white/[0.08]">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Members</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{activeMembers}</p>
          <p className="text-xs text-zinc-500 font-mono">
            {data.members.length} total · {inactiveMembers} expired
          </p>
        </div>

        <div className="glass-panel p-5 rounded-lg space-y-2 border border-white/[0.08]">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Today&apos;s Check-Ins</span>
            <QrCode className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{data.attendance.length}</p>
          <p className="text-xs text-primary/90 font-mono">Front-desk kiosk</p>
        </div>

        <div className="glass-panel p-5 rounded-lg space-y-2 border border-white/[0.08]">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Settled Revenue</span>
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">₹{totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-primary/90 font-mono">{data.payments.length} transactions</p>
        </div>

        <div className="glass-panel p-5 rounded-lg space-y-2 border border-white/[0.08]">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Plans</span>
            <Sliders className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{data.plans.length}</p>
          <p className="text-xs text-zinc-500 font-mono">Configured tiers</p>
        </div>
      </div>

      {/* Membership Plans Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white tracking-tight">Configured Membership Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.plans.map((p) => (
            <div key={p.id} className="glass-panel p-5 rounded-lg space-y-3 relative overflow-hidden border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-base">{p.name}</h3>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                  {p.durationDays} days
                </span>
              </div>
              <p className="text-xs text-zinc-400 min-h-[32px]">{p.description || "Standard gym pass"}</p>
              <div className="pt-2 border-t border-white/[0.08] flex items-baseline justify-between">
                <p className="text-2xl font-bold text-white font-mono">₹{parseFloat(p.price).toFixed(2)}</p>
                <span className="text-[11px] text-zinc-500 font-mono">Managed Plan</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Members Overview Table */}
      <div className="glass-panel rounded-lg overflow-hidden border border-white/[0.08]">
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Registered Athletes & Members</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Roster of registered athletes and active pass holders</p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-900/50">
              <TableHead>Member Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kiosk Pass Code</TableHead>
              <TableHead>Joined Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                  No members registered in this gym yet.
                </TableCell>
              </TableRow>
            ) : (
              data.members.map((m) => (
                <TableRow key={m.id} className="hover:bg-zinc-800/30">
                  <TableCell className="font-medium text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-sm bg-primary/10 border border-primary/25 text-primary flex items-center justify-center text-xs font-bold font-mono">
                        {m.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm">{m.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-300">{m.phone}</TableCell>
                  <TableCell>
                    <Badge variant={m.status === "active" ? "success" : "destructive"}>
                      {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-400">
                    <span className="bg-[#171717] px-2 py-0.5 rounded-sm border border-white/[0.08] select-all">
                      {m.qrToken.slice(0, 10)}...
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-400">
                    {m.joinDate ? new Date(m.joinDate).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Reveal>
  );
}
