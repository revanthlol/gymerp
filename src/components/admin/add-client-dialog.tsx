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
import { createMemberAction } from "@/lib/api/members";
import { useRouter } from "next/navigation";
import { Plus, UserPlus } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface AddClientDialogProps {
  plans: Array<{ id: string; name: string; price: string; durationDays: number }>;
  onMemberAdded?: (member: any) => void;
}

const fieldClass =
  "flex h-9 w-full rounded-lg border border-border bg-muted/60 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors";

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
        toast.success(`"${res.member.fullName}" registered successfully`);
        setOpen(false);
        if (onMemberAdded) onMemberAdded(res.member);
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
      toast.error(err.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-9 px-4 rounded-xl gap-2 text-xs font-semibold shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <Plus className="size-3.5 stroke-[2.5]" />
          <span>Add Member</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-4 text-primary" />
            Register New Member
          </DialogTitle>
          <DialogDescription>
            Add a member to your gym and assign their membership plan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="add-member-form">
          <DialogBody className="space-y-3.5">
            {/* Full name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Full Name *</label>
              <Input
                required
                placeholder="e.g. Sarah Cole"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={fieldClass}
              />
            </div>

            {/* Phone + Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Phone *</label>
                <Input
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={fieldClass + " font-mono"}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className={fieldClass}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                  <option value="Unspecified">Unspecified</option>
                </select>
              </div>
            </div>

            {/* Email + DOB */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="sarah@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Date of Birth</label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className={fieldClass}
                />
              </div>
            </div>

            {/* Emergency contact */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Emergency Contact</label>
              <Input
                placeholder="Name + Phone"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className={fieldClass}
              />
            </div>

            {/* Plan */}
            {plans.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Membership Plan</label>
                <select
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                  className={fieldClass}
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{parseFloat(p.price).toFixed(0)} · {p.durationDays}d
                    </option>
                  ))}
                </select>
              </div>
            )}
          </DialogBody>
        </form>

        <DialogFooter>
          <Button
            type="submit"
            form="add-member-form"
            disabled={loading}
            size="sm"
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Spinner size="sm" variant="current" className="mr-2" />
                Registering...
              </>
            ) : (
              "Register Member"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
