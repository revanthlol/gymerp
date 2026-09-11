import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { attendance, members } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Reveal } from "@/components/Reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { QrCode, LogIn, LogOut, Clock, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StaffAttendancePage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const data: { attendance: any[]; members: any[] } = await withTenantDb(session, async (tx) => {
    const [rawAttendance, rawMembers] = await Promise.all([
      tx
        .select()
        .from(attendance)
        .where(eq(attendance.tenantId, session.tenantId!))
        .orderBy(desc(attendance.checkedInAt))
        .limit(100),
      tx.select().from(members).where(eq(members.tenantId, session.tenantId!)),
    ]);
    return { attendance: rawAttendance, members: rawMembers };
  });

  const memberMap = new Map(data.members.map((m: any) => [m.id, m]));

  return (
    <Reveal className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Live Turnstile & Ingress Feed
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time feed of member kiosk check-ins, smartphone QR scans, and front-desk entries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/staff/kiosk" target="_blank">
            <Button
              size="sm"
              className="bg-primary hover:bg-primary-deep text-[#08090a] font-semibold text-xs h-9 px-3.5 rounded-lg flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4" />
              <span>Launch Kiosk Display</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden">
        <Table>
          <TableHeader className="bg-[#0c0d10] border-b border-white/[0.08]">
            <TableRow className="border-white/[0.08]">
              <TableHead className="text-xs font-semibold text-zinc-400">Athlete</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-400">Direction</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-400">Method</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-400">Kiosk Terminal</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-400 text-right">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-white/[0.05]">
            {data.attendance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-zinc-500 text-xs">
                  No attendance records recorded yet today.
                </TableCell>
              </TableRow>
            ) : (
              data.attendance.map((record: any) => {
                const member: any = memberMap.get(record.memberId);
                const isExit = record.method.includes("exit");
                return (
                  <TableRow key={record.id} className="hover:bg-white/[0.02] border-white/[0.05]">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#14161b] border border-white/[0.08] flex items-center justify-center text-xs font-bold text-zinc-300">
                          {member?.fullName.slice(0, 2).toUpperCase() || "AT"}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {member?.fullName || "Gym Member"}
                          </p>
                          <p className="text-[11px] text-zinc-500 font-mono">
                            {member?.phone || `Pass #${record.memberId.slice(0, 8)}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase border ${
                          isExit
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-primary/10 text-primary border-primary/20"
                        }`}
                      >
                        {isExit ? <LogOut className="w-3 h-3" /> : <LogIn className="w-3 h-3" />}
                        <span>{isExit ? "Check-Out" : "Check-In"}</span>
                      </span>
                    </TableCell>
                    <TableCell className="py-3 font-mono text-xs text-zinc-400 uppercase">
                      {record.method}
                    </TableCell>
                    <TableCell className="py-3 font-mono text-xs text-zinc-500">
                      {record.kioskId || "kiosk-default"}
                    </TableCell>
                    <TableCell className="py-3 text-right font-mono text-xs text-zinc-400">
                      {new Date(record.checkedInAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Reveal>
  );
}
