import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { members, membershipPlans } from "@/lib/db/schema";
import { ClientsView } from "@/components/admin/clients-view";
import { Reveal } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const data = await withTenantDb(session, async (tx) => {
    const tenantMembers = await tx.select().from(members);
    const tenantPlans = await tx.select().from(membershipPlans);

    return {
      members: tenantMembers,
      plans: tenantPlans,
    };
  });

  return (
    <Reveal>
      <ClientsView initialMembers={data.members} plans={data.plans} />
    </Reveal>
  );
}
