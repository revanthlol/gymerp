import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { attendance, members } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Reveal } from "@/components/Reveal";
import { Badge } from "@/components/ui/badge";
import { TurnstileQrDialog } from "@/components/admin/turnstile-qr-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

interface AdminAttendanceData {
  attendance: Array<typeof attendance.$inferSelect>;
  members: Array<typeof members.$inferSelect>;
}

export default async function AdminAttendancePage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const data: AdminAttendanceData = await withTenantDb(
    session,
    async (tx): Promise<AdminAttendanceData> => {
      const [rawAttendance, rawMembers] = await Promise.all([
        tx
          .select()
          .from(attendance)
          .orderBy(desc(attendance.checkedInAt))
          .limit(50),
        tx.select().from(members),
      ]);
      return { attendance: rawAttendance, members: rawMembers };
    }
  );

  const memberMap = new Map(data.members.map((m) => [m.id, m]));

  return (
    <Reveal className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight supa-heading-lg">
            Attendance & Check-Ins
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time feed of member kiosk check-ins, QR scans, and front-desk entries.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <TurnstileQrDialog />
          <div className="text-xs font-mono text-primary bg-primary/10 border border-primary/25 px-2.5 py-1.5 rounded-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Live Scan Stream</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.08] bg-[#1c1c1c]/90 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/[0.08] bg-white/[0.02]">
              <TableHead className="text-zinc-400 font-medium text-xs">Athlete</TableHead>
              <TableHead className="text-zinc-400 font-medium text-xs">Scan Method</TableHead>
              <TableHead className="text-zinc-400 font-medium text-xs">Terminal / Kiosk ID</TableHead>
              <TableHead className="text-zinc-400 font-medium text-xs">Timestamp</TableHead>
              <TableHead className="text-right text-zinc-400 font-medium text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.attendance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                  No attendance records found
                </TableCell>
              </TableRow>
            ) : (
              data.attendance.map((record) => {
                const member = memberMap.get(record.memberId);
                return (
                  <TableRow key={record.id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-sm bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs font-mono">
                          {(member?.fullName || "M").charAt(0)}
                        </div>
                        <span className="text-sm">{member?.fullName || "Unknown Member"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-300">
                      <span className="bg-[#171717] px-2 py-0.5 rounded-sm border border-white/[0.08] uppercase text-[10px]">
                        {record.method}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-400">
                      {record.kioskId || "front-kiosk-01"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-400">
                      {new Date(record.checkedInAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="success">Granted</Badge>
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
