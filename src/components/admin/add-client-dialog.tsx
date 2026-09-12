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
import { useRouter } from "next/navigation";
import { Plus, UserPlus } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface AddClientDialogProps {
  plans: Array<{ id: string; name: string; price: string; durationDays: number }>;
  onMemberAdded?: (member: any) => void;
}

export function AddClientDialog({ plans, onMemberAdded }: AddClientDialogProps) {
  const router = useRouter();
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
        toast.success(`Athlete "${res.member.fullName}" registered successfully!`);
        setOpen(false);
        if (onMemberAdded) {
          onMemberAdded(res.member);
        }
        router.refresh();
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
      toast.error(err.message || "Failed to add athlete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-primary hover:bg-primary-deep text-[#08090a] font-semibold h-9 px-3.5 rounded-lg flex items-center gap-1.5 transition-all text-xs"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Athlete</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <span>Register New Athlete</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Add a member to your gym database and issue their digital check-in pass.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">Athlete Full Name *</label>
            <Input
              required
              placeholder="e.g. Sarah Cole"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="bg-[#08090a] border-white/[0.08] text-xs text-zinc-100 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Phone Number *</label>
              <Input
                required
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-[#08090a] border-white/[0.08] text-xs font-mono text-zinc-100 focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as any })
                }
                className="flex h-9 w-full rounded-md border border-white/[0.08] bg-[#08090a] px-3 py-1 text-xs text-zinc-100 focus:border-primary focus:outline-none"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Unspecified">Unspecified</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Email (Optional)</label>
              <Input
                type="email"
                placeholder="sarah.cole@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-[#08090a] border-white/[0.08] text-xs text-zinc-100 focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Date of Birth</label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="bg-[#08090a] border-white/[0.08] text-xs text-zinc-100 focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">Emergency Contact</label>
            <Input
              placeholder="e.g. John Cole (+91 91234 56789)"
              value={formData.emergencyContact}
              onChange={(e) =>
                setFormData({ ...formData, emergencyContact: e.target.value })
              }
              className="bg-[#08090a] border-white/[0.08] text-xs text-zinc-100 focus:border-primary"
            />
          </div>

          {plans.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Initial Membership Plan</label>
              <select
                value={formData.planId}
                onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                className="flex h-9 w-full rounded-md border border-white/[0.08] bg-[#08090a] px-3 py-1 text-xs text-zinc-100 focus:border-primary focus:outline-none"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{parseFloat(p.price).toFixed(2)} ({p.durationDays} days)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-deep text-[#08090a] font-semibold text-xs h-9"
            >
              {loading ? (
                <>
                  <Spinner size="sm" variant="current" className="mr-2" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register Athlete</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
