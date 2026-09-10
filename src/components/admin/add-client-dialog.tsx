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
import { createMemberAction } from "@/lib/api/members";
import { Plus, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface AddClientDialogProps {
  plans: Array<{ id: string; name: string; price: string; durationDays: number }>;
}

export function AddClientDialog({ plans }: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "Unspecified" as "Male" | "Female" | "Other" | "Unspecified",
    dateOfBirth: "",
    emergencyContact: "",
    planId: plans[0]?.id || "",
    isVip: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await createMemberAction(formData);
      if (res.success) {
        toast.success(`Client "${res.member.fullName}" added successfully!`);
        setOpen(false);
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          gender: "Unspecified",
          dateOfBirth: "",
          emergencyContact: "",
          planId: plans[0]?.id || "",
          isVip: false,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title="Add Client"
          className="w-9 h-9 rounded-xl bg-brand text-carbon-950 flex items-center justify-center font-bold shadow-[0_0_16px_rgba(118,185,0,0.3)] hover:bg-brand-hover active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 text-carbon-950 stroke-[2.5]" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand" />
            <span>Register New Member</span>
          </DialogTitle>
          <DialogDescription>
            Add a member to your gym and generate their personal digital pass.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Athlete Full Name</label>
            <Input
              required
              placeholder="e.g. Sarah Cole"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Phone Number</label>
              <Input
                required
                placeholder="+380 (66) 237 98 54"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as any })
                }
                className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/50"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Unspecified">Unspecified</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Email (Optional)</label>
              <Input
                type="email"
                placeholder="sarah.cole@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Date of Birth</label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Address / Emergency Contact</label>
            <Input
              placeholder="Korolenko Street 24, 4/51"
              value={formData.emergencyContact}
              onChange={(e) =>
                setFormData({ ...formData, emergencyContact: e.target.value })
              }
            />
          </div>

          {plans.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Initial Membership Tier</label>
              <select
                value={formData.planId}
                onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/50"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${parseFloat(p.price).toFixed(2)} ({p.durationDays} days)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Registering Athlete...</span>
                </>
              ) : (
                <span>Add Client</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
