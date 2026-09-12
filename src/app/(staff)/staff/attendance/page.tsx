import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { attendance, members } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Reveal } from "@/components/Reveal";
import { AttendanceView } from "@/components/admin/attendance-view";

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

  return (
    <Reveal className="space-y-6 pb-12">
      <AttendanceView initialAttendance={data.attendance} members={data.members} />
    </Reveal>
  );
}
