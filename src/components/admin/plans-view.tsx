"use client";

import React, { useState, useEffect } from "react";
import { AddPlanDialog } from "./add-plan-dialog";
import { EditPlanDialog } from "./edit-plan-dialog";
import { Clock, Users, Sparkles, Trash2, Pencil } from "lucide-react";
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
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

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
                className={`relative flex flex-col justify-between gap-4 rounded-xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 group ${
                  p.isActive === "false" ? "opacity-70 border-dashed border-border" : "border-border"
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground text-sm truncate">{p.name}</h3>
                      {p.isActive === "false" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">Inactive</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />
                      {p.durationDays} days
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingPlan(p);
                        setIsEditOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
                      title="Edit Plan"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      title="Delete Plan"
                    >
                      {isDeleting ? (
                        <Spinner size="sm" variant="current" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>
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

      <EditPlanDialog
        plan={editingPlan}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onPlanUpdated={(updated) => {
          setPlans((prev) => prev.map((pl) => pl.id === updated.id ? updated : pl));
        }}
      />
    </div>
  );
}
