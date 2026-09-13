"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePlanAction } from "@/lib/api/plans";
import { useRouter } from "next/navigation";
import { Edit3, Check } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export interface PlanData {
  id: string;
  name: string;
  description: string | null;
  price: string;
  durationDays: number;
  isActive: string;
}

interface EditPlanDialogProps {
  plan: PlanData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanUpdated?: (updated: PlanData) => void;
}

const fieldClass =
  "flex h-9 w-full rounded-xl border border-border bg-muted/60 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors";

export function EditPlanDialog({
  plan,
  open,
  onOpenChange,
  onPlanUpdated,
}: EditPlanDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [isActive, setIsActive] = useState<"true" | "false">("true");

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setDescription(plan.description || "");
      setPrice(plan.price);
      setDurationDays(String(plan.durationDays));
      setIsActive((plan.isActive as "true" | "false") || "true");
    }
  }, [plan]);

  if (!plan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) {
      toast.error("Please provide plan name and price");
      return;
    }
    setLoading(true);
    try {
      const res = await updatePlanAction(plan.id, {
        name: name.trim(),
        description: description.trim(),
        price: price.trim(),
        durationDays: parseInt(durationDays, 10) || 30,
        isActive,
      });

      if (res.success && res.plan) {
        toast.success(`Plan "${name}" updated`);
        onPlanUpdated?.(res.plan as PlanData);
        router.refresh();
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Edit3 className="size-4 text-primary" />
            Edit Membership Plan
          </DialogTitle>
          <DialogDescription className="text-xs">
            Modify pricing, duration term, or availability for this tier.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="edit-plan-form">
          <DialogBody className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Plan Name *</label>
              <Input
                required
                placeholder="e.g. Monthly Unlimited"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Input
                placeholder="e.g. Unlimited gym & cardio access"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Price (₹) *</label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="2499"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Duration (Days)</label>
                <Input
                  required
                  type="number"
                  min="1"
                  placeholder="30"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-muted-foreground">Plan Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsActive("true")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                    isActive === "true"
                      ? "bg-primary/10 border-primary/30 text-primary font-semibold shadow-xs"
                      : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>Active</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsActive("false")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                    isActive === "false"
                      ? "bg-muted border-border text-foreground font-semibold shadow-xs"
                      : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-zinc-400" />
                  <span>Inactive</span>
                </button>
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="h-9 px-4 text-xs gap-1.5 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all"
            >
              {loading ? (
                <>
                  <Spinner size="sm" variant="current" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
