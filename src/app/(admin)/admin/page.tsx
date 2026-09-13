import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { members, membershipPlans, attendance, payments, tenants, memberships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Reveal } from "@/components/Reveal";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const data = await withTenantDb(session, async (tx) => {
    const [tenantRecords, tenantMembers, tenantPlans, tenantAttendance, tenantPayments, tenantMemberships] =
      await Promise.all([
        tx.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, session.tenantId!)).limit(1),
        tx.select().from(members),
        tx.select().from(membershipPlans),
        tx.select().from(attendance),
        tx.select().from(payments),
        tx.select().from(memberships),
      ]);

    return {
      gymName: tenantRecords[0]?.name || "Facility",
      members: tenantMembers,
      plans: tenantPlans,
      attendance: tenantAttendance,
      payments: tenantPayments,
      memberships: tenantMemberships,
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
        membershipsList={data.memberships}
      />
    </Reveal>
  );
}
