"use client";

import React, { useState, useEffect } from "react";
import { AddPlanDialog } from "./add-plan-dialog";
import { Clock, Users, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { deletePlanAction } from "@/lib/api/plans";

interface PlanItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  durationDays: number;
  isActive: string;
}

interface MembershipItem {
  id: string;
  planId: string;
  status: string;
}

interface PlansViewProps {
  initialPlans: PlanItem[];
  initialMemberships: MembershipItem[];
}

export function PlansView({ initialPlans, initialMemberships }: PlansViewProps) {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanItem[]>(initialPlans);
  const [memberships, setMemberships] = useState<MembershipItem[]>(initialMemberships);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { setPlans(initialPlans); }, [initialPlans]);
  useEffect(() => { setMemberships(initialMemberships); }, [initialMemberships]);

  const handleDelete = async (planId: string, planName: string) => {
    if (!confirm(`Delete plan "${planName}"? This cannot be undone.`)) return;
    setDeletingId(planId);
    try {
      await deletePlanAction(planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      toast.success(`Plan "${planName}" deleted`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete plan");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Membership Plans</h1>
          <p className="text-sm text-muted-foreground">
            {plans.length} plan{plans.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <AddPlanDialog onPlanCreated={(newPlan) => setPlans((prev) => [newPlan, ...prev])} />
      </div>

      {/* Plans grid */}
      {plans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground">
            <Sparkles className="size-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">No plans yet</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              Create your first membership tier to start enrolling members.
            </p>
          </div>
          <AddPlanDialog onPlanCreated={(newPlan) => setPlans((prev) => [newPlan, ...prev])} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => {
            const subscriberCount = memberships.filter(
              (m) => m.planId === p.id && m.status === "active"
            ).length;
            const isDeleting = deletingId === p.id;

            return (
              <div
                key={p.id}
                className="relative flex flex-col gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors group"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{p.name}</h3>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />
                      {p.durationDays} days
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    disabled={isDeleting}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    {isDeleting ? (
                      <Spinner size="sm" variant="current" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.5rem]">
                  {p.description || "Full gym facility access with digital check-in pass."}
                </p>

                {/* Footer */}
                <div className="pt-3 border-t border-border flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-foreground font-mono">
                      ₹{parseFloat(p.price).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">/ term</span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="size-3" />
                    {subscriberCount} active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
