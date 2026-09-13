"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPlanAction } from "@/lib/api/plans";
import { useRouter } from "next/navigation";
import { Plus, Sliders } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface AddPlanDialogProps {
  onPlanCreated?: (newPlan: any) => void;
}

const fieldClass =
  "flex h-9 w-full rounded-lg border border-border bg-muted/60 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors";

export function AddPlanDialog({ onPlanCreated }: AddPlanDialogProps = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("30");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) {
      toast.error("Please provide plan name and price");
      return;
    }
    setLoading(true);
    try {
      const res = await createPlanAction({
        name: name.trim(),
        description: description.trim(),
        price: price.trim(),
        durationDays: parseInt(durationDays, 10) || 30,
      });
      if (res.success) {
        toast.success(`Plan "${name}" created`);
        if (res.plan) onPlanCreated?.(res.plan);
        router.refresh();
        setOpen(false);
        setName("");
        setDescription("");
        setPrice("");
        setDurationDays("30");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 text-xs">
          <Plus className="size-3.5 stroke-[2.5]" />
          Create Plan
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sliders className="size-4 text-primary" />
            New Membership Plan
          </DialogTitle>
          <DialogDescription>
            Set pricing, duration, and features for this pass.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="add-plan-form">
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Price (₹) *</label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  placeholder="2499"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={fieldClass + " font-mono"}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Duration (days) *</label>
                <Input
                  required
                  type="number"
                  min="1"
                  max="3650"
                  placeholder="30"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className={fieldClass + " font-mono"}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Input
                placeholder="Full gym access, steam room, lockers"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={fieldClass}
              />
            </div>
          </DialogBody>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-plan-form"
            disabled={loading}
            size="sm"
          >
            {loading ? (
              <>
                <Spinner size="sm" variant="current" className="mr-1.5" />
                Creating...
              </>
            ) : (
              "Create Plan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
