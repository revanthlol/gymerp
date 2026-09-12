import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { attendance, members } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Reveal } from "@/components/Reveal";
import { AttendanceView } from "@/components/admin/attendance-view";

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

  return (
    <Reveal className="space-y-8">
      <AttendanceView initialAttendance={data.attendance} members={data.members} />
    </Reveal>
  );
}
