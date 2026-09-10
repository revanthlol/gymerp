import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { members, membershipPlans } from "@/lib/db/schema";
import { generateGymRotatingQr } from "@/lib/attendance/qr";
import { Reveal } from "@/components/Reveal";
import { AthleteMobilePreview } from "@/components/mobile/athlete-mobile-preview";

export const dynamic = "force-dynamic";

export default async function MobilePreviewPage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const currentGymQr = await generateGymRotatingQr(session.tenantId);

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
      <AthleteMobilePreview
        members={data.members}
        plans={data.plans}
        currentGymQr={currentGymQr}
      />
    </Reveal>
  );
}
