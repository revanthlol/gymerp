"use client";

import React, { useState, useEffect } from "react";
import { AddPlanDialog } from "./add-plan-dialog";
import { Sparkles, Users, Clock, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

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

  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);

  useEffect(() => {
    setMemberships(initialMemberships);
  }, [initialMemberships]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Membership Plans</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure tiered passes, duration cycles, and recurring billing rates.
          </p>
        </div>

        <AddPlanDialog
          onPlanCreated={(newPlan) => {
            setPlans((prev) => [newPlan, ...prev]);
          }}
        />
      </div>

      {plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">No membership plans created yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              Create your gym's first pass tier (Monthly Unlimited, 10-Class Pack, or Annual VIP) to start enrolling athletes.
            </p>
          </div>
          <AddPlanDialog
            onPlanCreated={(newPlan) => {
              setPlans((prev) => [newPlan, ...prev]);
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((p) => {
            const subscriberCount = memberships.filter(
              (m) => m.planId === p.id && m.status === "active"
            ).length;

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-white/[0.07] bg-[#0c0d10] p-6 space-y-4 relative overflow-hidden shadow-sm hover:border-primary/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base tracking-tight">{p.name}</h3>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/20 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{p.durationDays} Days</span>
                  </span>
                </div>

                <p className="text-xs text-zinc-400 min-h-[36px] line-clamp-2 leading-relaxed">
                  {p.description || "Full gym facility access with dynamic QR check-in pass."}
                </p>

                <div className="pt-4 border-t border-white/[0.07] flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-white font-mono">
                      ₹{parseFloat(p.price).toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-500 ml-1">/ term</span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400 flex items-center gap-1 bg-white/[0.03] px-2 py-1 rounded-md border border-white/[0.05]">
                    <Users className="w-3 h-3 text-zinc-500" />
                    <span>{subscriberCount} enrolled</span>
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
