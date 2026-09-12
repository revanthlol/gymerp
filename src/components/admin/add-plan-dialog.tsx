"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPlanAction } from "@/lib/api/plans";
import { Plus, Sliders } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export function AddPlanDialog() {
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
        toast.success(`Plan "${name}" created successfully!`);
        setOpen(false);
        setName("");
        setDescription("");
        setPrice("");
        setDurationDays("30");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create membership plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary-deep text-[#08090a] font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 text-xs">
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create New Plan</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            <span>New Membership Plan</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Define pricing, valid duration, and features for this pass tier.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">Plan Name *</label>
            <Input
              required
              placeholder="e.g. Quarterly Unlimited, Student Pass"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#08090a] border-white/[0.08] text-xs text-zinc-100 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Price (INR) *</label>
              <Input
                required
                type="number"
                step="0.01"
                placeholder="2499.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-[#08090a] border-white/[0.08] text-xs font-mono text-zinc-100 focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Duration (Days) *</label>
              <Input
                required
                type="number"
                min="1"
                max="3650"
                placeholder="30"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="bg-[#08090a] border-white/[0.08] text-xs font-mono text-zinc-100 focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">Description / Features</label>
            <Input
              placeholder="Access to all gym areas, steam room, and lockers"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#08090a] border-white/[0.08] text-xs text-zinc-100 focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-white/[0.08] text-xs bg-white/[0.03] text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary-deep text-[#08090a] font-semibold text-xs"
            >
              {loading ? (
                <>
                  <Spinner size="xs" className="mr-1.5 text-[#08090a]" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Plan</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
