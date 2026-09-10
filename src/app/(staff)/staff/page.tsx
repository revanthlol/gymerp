import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { members, attendance } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { QrCode, Users, CreditCard, Clock, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface StaffDashboardData {
  members: Array<typeof members.$inferSelect>;
  attendance: Array<typeof attendance.$inferSelect>;
}

export default async function StaffHomePage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const data: StaffDashboardData = await withTenantDb(session, async (tx) => {
    const tenantMembers = await tx.select().from(members);
    const recentAttendance = await tx
      .select()
      .from(attendance)
      .orderBy(desc(attendance.checkedInAt))
      .limit(10);

    return {
      members: tenantMembers,
      attendance: recentAttendance,
    };
  });

  const activeMembersCount = data.members.filter((m) => m.status === "active").length;

  return (
    <Reveal className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Front-Desk Operations</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Quick check-ins, member lookups, and turnstile terminal control.
          </p>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/staff/kiosk"
          className="glass-panel p-5 rounded-2xl border-brand/30 hover:border-brand/60 bg-gradient-to-br from-brand/5 to-transparent transition-all group block relative overflow-hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <QrCode className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-white">Self-Service Kiosk</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Launch 2-hour dynamic rotating turnstile check-in terminal.
          </p>
        </Link>

        <div className="glass-panel p-5 rounded-2xl space-y-2 border border-zinc-800/80">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-white">Member Directory</h2>
          <p className="text-xs text-zinc-400">
            {activeMembersCount} active of {data.members.length} total members ready for lookup.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2 border border-zinc-800/80">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
            <CreditCard className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-white">Front-Desk Ledger</h2>
          <p className="text-xs text-zinc-400">
            Member passes, overdue renewals, and front-desk settlements.
          </p>
        </div>
      </div>

      {/* Live Check-in Feed */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800/80">
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-brand" />
            <h2 className="text-base font-semibold text-white">Today&apos;s Turnstile Log</h2>
          </div>
          <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
            {data.attendance.length} check-ins logged
          </span>
        </div>

        <div className="divide-y divide-zinc-800/60 text-sm">
          {data.attendance.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">No check-ins recorded yet today.</div>
          ) : (
            data.attendance.map((record) => {
              const member = data.members.find((m) => m.id === record.memberId);
              return (
                <div
                  key={record.id}
                  className="p-4 px-5 flex items-center justify-between hover:bg-zinc-800/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{member?.fullName || "Member"}</p>
                      <p className="text-xs text-zinc-500 font-mono">Pass #{record.memberId.slice(0, 8)}</p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs text-zinc-400">
                    <p>
                      {new Date(record.checkedInAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <span className="text-[10px] text-zinc-500 uppercase">{record.method}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Reveal>
  );
}
