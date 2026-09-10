import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { membershipPlans, memberships } from "@/lib/db/schema";
import { Reveal } from "@/components/Reveal";
import { Badge } from "@/components/ui/badge";

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
    <Reveal className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Scheduling & Plans</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure tiered membership passes, duration schedules, and billing cycles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {data.plans.map((p) => {
          const subscriberCount = data.memberships.filter(
            (m) => m.planId === p.id && m.status === "active"
          ).length;

          return (
            <div
              key={p.id}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-6 space-y-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-lg">{p.name}</h3>
                <Badge variant="vip">{p.durationDays} Days</Badge>
              </div>

              <p className="text-xs text-zinc-400 min-h-[36px]">
                {p.description || "Standard gym pass with QR check-in access."}
              </p>

              <div className="pt-4 border-t border-zinc-850 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-bold text-white font-mono">
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
