import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { membershipPlans, memberships } from "@/lib/db/schema";
import { Reveal } from "@/components/Reveal";
import { PlansView } from "@/components/admin/plans-view";

export const dynamic = "force-dynamic";

interface AdminPlansData {
  plans: Array<typeof membershipPlans.$inferSelect>;
  memberships: Array<typeof memberships.$inferSelect>;
}

export default async function AdminPlansPage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const data: AdminPlansData = await withTenantDb(
    session,
    async (tx): Promise<AdminPlansData> => {
      const [plans, activeMemberships] = await Promise.all([
        tx.select().from(membershipPlans),
        tx.select().from(memberships),
      ]);
      return { plans, memberships: activeMemberships };
    }
  );

  return (
    <Reveal className="space-y-6">
      <PlansView initialPlans={data.plans} initialMemberships={data.memberships} />
    </Reveal>
  );
}
