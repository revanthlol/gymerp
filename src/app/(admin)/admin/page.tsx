import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { members, membershipPlans, attendance, payments, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Reveal } from "@/components/Reveal";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";

export const dynamic = "force-dynamic";

interface AdminDashboardData {
  gymName: string;
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
    const [tenantRecords, tenantMembers, tenantPlans, tenantAttendance, tenantPayments] =
      await Promise.all([
        tx.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, session.tenantId!)).limit(1),
        tx.select().from(members),
        tx.select().from(membershipPlans),
        tx.select().from(attendance),
        tx.select().from(payments),
      ]);

    return {
      gymName: tenantRecords[0]?.name || "Facility",
      members: tenantMembers,
      plans: tenantPlans,
      attendance: tenantAttendance,
      payments: tenantPayments,
    };
  });

  if (data.plans.length === 0) {
    redirect("/admin/onboarding");
  }

  return (
    <Reveal className="w-full">
      <AdminDashboardView
        gymName={data.gymName}
        adminEmail={session.email}
        adminName={session.displayName}
        membersList={data.members}
        plansList={data.plans}
        attendanceList={data.attendance}
        paymentsList={data.payments}
      />
    </Reveal>
  );
}
