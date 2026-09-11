import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { members, attendance, tenants } from "@/lib/db/schema";
import { desc, eq, gte } from "drizzle-orm";
import { StaffDashboardView } from "@/components/staff/staff-dashboard-view";
import { Reveal } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export default async function StaffHomePage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const data = await withTenantDb(session, async (tx) => {
    const [tenantList, tenantMembers, recentAttendance] = await Promise.all([
      tx.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, session.tenantId!)).limit(1),
      tx.select().from(members).where(eq(members.tenantId, session.tenantId!)),
      tx
        .select()
        .from(attendance)
        .where(eq(attendance.tenantId, session.tenantId!))
        .orderBy(desc(attendance.checkedInAt))
        .limit(50),
    ]);

    return {
      gymName: tenantList[0]?.name || "GymERP Center",
      members: tenantMembers,
      attendance: recentAttendance,
    };
  });

  return (
    <Reveal>
      <StaffDashboardView
        gymName={data.gymName}
        initialMembers={data.members as any}
        todayAttendance={data.attendance as any}
      />
    </Reveal>
  );
}
