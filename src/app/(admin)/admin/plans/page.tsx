import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { membershipPlans, memberships } from "@/lib/db/schema";
import { Reveal } from "@/components/Reveal";
import { AddPlanDialog } from "@/components/admin/add-plan-dialog";

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Membership Plans</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure tiered membership passes, duration schedules, and billing rates.
          </p>
        </div>

        <AddPlanDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.plans.map((p) => {
          const subscriberCount = data.memberships.filter(
            (m) => m.planId === p.id && m.status === "active"
          ).length;

          return (
            <div
              key={p.id}
              className="rounded-xl border border-white/[0.07] bg-[#0c0d10] p-6 space-y-4 relative overflow-hidden shadow-sm hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base tracking-tight">{p.name}</h3>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                  {p.durationDays} Days
                </span>
              </div>

              <p className="text-xs text-zinc-400 min-h-[36px]">
                {p.description || "Full gym facility access with dynamic QR check-in pass."}
              </p>

              <div className="pt-4 border-t border-white/[0.07] flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold text-white font-mono">
                    ₹{parseFloat(p.price).toFixed(2)}
                  </span>
                  <span className="text-xs text-zinc-500 ml-1">/ term</span>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {subscriberCount} enrolled
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Reveal>
  );
}
