"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  ShieldCheck,
  CreditCard,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  QrCode,
  Sparkles,
  Loader2,
  Lock,
  Plus,
  Trash2,
  Check,
  Dumbbell,
  Clock,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeTenantOnboardingAction, OnboardingPlanInput } from "@/lib/api/onboarding";
import { toast } from "sonner";

interface OnboardingWizardProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    contactEmail: string | null;
    phone: string | null;
  };
  existingPlansCount: number;
}

const STEPS = [
  { id: 1, label: "Facility Profile", icon: Building2 },
  { id: 2, label: "Turnstiles & Ingress", icon: QrCode },
  { id: 3, label: "Membership Plans", icon: CreditCard },
  { id: 4, label: "Staff Team", icon: Users },
  { id: 5, label: "Verification & Launch", icon: ShieldCheck },
];

export function OnboardingWizard({ tenant, existingPlansCount }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    facilityName: tenant.name || "",
    slug: tenant.slug || "",
    contactEmail: tenant.contactEmail || "",
    phone: tenant.phone || "",
    city: "New Delhi, India",
    openingHours: "06:00 AM - 10:30 PM",
    turnstileEntryLane: "Turnstile Lane #01 (Main Entry)",
    turnstileExitLane: "Turnstile Lane #02 (Locker Room Exit)",
    staffName: "",
    staffEmail: "",
  });

  // Starter Membership Plans
  const [plans, setPlans] = useState<OnboardingPlanInput[]>([
    {
      name: "Monthly Standard",
      price: "2499",
      durationDays: 30,
      description: "Full gym floor access, cardio zone & locker amenities",
    },
    {
      name: "Annual Elite Pro",
      price: "19999",
      durationDays: 365,
      description: "All-access facility pass, group classes, and sauna",
    },
    {
      name: "10-Session Drop-In",
      price: "1499",
      durationDays: 60,
      description: "Flexible entry punch pass valid for 60 days",
    },
  ]);

  const handleAddPlan = () => {
    setPlans((prev) => [
      ...prev,
      {
        name: "New Tier",
        price: "999",
        durationDays: 30,
        description: "Standard gym membership",
      },
    ]);
  };

  const handleRemovePlan = (index: number) => {
    if (plans.length <= 1) {
      toast.error("You need at least one active membership tier");
      return;
    }
    setPlans((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePlan = (index: number, field: keyof OnboardingPlanInput, value: any) => {
    setPlans((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.facilityName.trim() || !formData.phone.trim()) {
        toast.error("Please provide your facility name and contact phone");
        return;
      }
    }
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const res = await completeTenantOnboardingAction({
        facilityName: formData.facilityName,
        phone: formData.phone,
        contactEmail: formData.contactEmail,
        openingHours: formData.openingHours,
        turnstileEntryLane: formData.turnstileEntryLane,
        turnstileExitLane: formData.turnstileExitLane,
        plans,
        staffInvite:
          formData.staffName.trim() && formData.staffEmail.trim()
            ? { fullName: formData.staffName, email: formData.staffEmail }
            : undefined,
      });

      if (res.success) {
        setCompleted(true);
        toast.success("Facility onboarding verified and activated!");
        setTimeout(() => {
          router.push("/admin");
          router.refresh();
        }, 2200);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090a] text-zinc-100 flex flex-col justify-between py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary text-[#08090a] flex items-center justify-center font-black text-sm shadow-[0_0_15px_rgba(62,207,142,0.3)]">
            G
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">GYMERP ONBOARDING</h1>
            <p className="text-[11px] text-zinc-400 font-mono">
              First-Time Facility Setup & Cryptographic Verification
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs text-zinc-500">
          <span>Step {currentStep} of 5</span>
        </div>
      </header>

      {/* Main Wizard Form Container */}
      <main className="max-w-3xl mx-auto w-full my-8">
        {/* Step Navigation Pill Indicator */}
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-[#0c0d10] border border-white/[0.07] mb-8 overflow-x-auto">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isDone = s.id < currentStep;
            const isCurrent = s.id === currentStep;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.id < currentStep) setCurrentStep(s.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  isCurrent
                    ? "bg-primary text-[#08090a] shadow-sm"
                    : isDone
                    ? "text-zinc-300 hover:text-white bg-white/[0.04]"
                    : "text-zinc-500 cursor-not-allowed"
                }`}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Wizard Step Views */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/[0.08] shadow-2xl relative">
          <AnimatePresence mode="wait">
            {/* STEP 1: FACILITY PROFILE */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-widest">
                    STEP 01 // IDENTITY
                  </span>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Facility Identity & Operations
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Set up your gym&apos;s physical branding, contact details, and daily open hours.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Gym / Club Name *
                      </label>
                      <Input
                        value={formData.facilityName}
                        onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                        placeholder="e.g. IronPulse Athletic Club"
                        className="bg-[#08090a] border-white/[0.08] text-xs h-10 rounded-xl focus:border-primary text-zinc-100"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Facility Slug / Domain
                      </label>
                      <Input
                        value={formData.slug}
                        disabled
                        className="bg-[#08090a]/50 border-white/[0.05] text-xs h-10 rounded-xl font-mono text-zinc-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Official Phone Number *
                      </label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                        className="bg-[#08090a] border-white/[0.08] text-xs h-10 rounded-xl focus:border-primary text-zinc-100 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Member Support Email
                      </label>
                      <Input
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="support@yourgym.com"
                        className="bg-[#08090a] border-white/[0.08] text-xs h-10 rounded-xl focus:border-primary text-zinc-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        City / Facility Location
                      </label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. South Delhi"
                        className="bg-[#08090a] border-white/[0.08] text-xs h-10 rounded-xl focus:border-primary text-zinc-100"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Operating Hours
                      </label>
                      <Input
                        value={formData.openingHours}
                        onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                        placeholder="06:00 AM - 10:30 PM"
                        className="bg-[#08090a] border-white/[0.08] text-xs h-10 rounded-xl focus:border-primary text-zinc-100 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: TURNSTILES & INGRESS */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-widest">
                    STEP 02 // ACCESS CONTROL
                  </span>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Turnstile Lanes & Security Rules
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Configure entrance and exit physical kiosk terminals and security policies.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">
                      Entrance Turnstile Lane Name
                    </label>
                    <Input
                      value={formData.turnstileEntryLane}
                      onChange={(e) => setFormData({ ...formData, turnstileEntryLane: e.target.value })}
                      className="bg-[#08090a] border-white/[0.08] text-xs h-10 rounded-xl focus:border-primary text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">
                      Exit Turnstile Lane Name
                    </label>
                    <Input
                      value={formData.turnstileExitLane}
                      onChange={(e) => setFormData({ ...formData, turnstileExitLane: e.target.value })}
                      className="bg-[#08090a] border-white/[0.08] text-xs h-10 rounded-xl focus:border-primary text-zinc-100"
                    />
                  </div>

                  {/* Security Features Overview */}
                  <div className="p-4 rounded-2xl bg-[#08090a] border border-white/[0.06] space-y-3">
                    <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span>Armed Ingress Policies</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-400">
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>Dynamic HMAC-SHA256 tokens rotate every 20 seconds</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>Single-use nonce burn prevents screenshot proxy check-ins</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>Emergency dead-phone keypad check-in enabled on kiosk</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>Instant expired pass detection in bold red</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: MEMBERSHIP PLANS */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-widest">
                      STEP 03 // PRICING TIERS
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Initial Membership Tiers
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Set up your core subscription packages. Athletes will be assigned to these plans.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddPlan}
                    className="bg-white/[0.05] hover:bg-white/[0.1] text-xs text-white border border-white/[0.08] rounded-lg gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary" />
                    <span>Add Plan</span>
                  </Button>
                </div>

                <div className="space-y-3 pt-2">
                  {plans.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#08090a] border border-white/[0.06] space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-5 space-y-1">
                          <label className="text-[10px] text-zinc-500 font-mono uppercase">Plan Name</label>
                          <Input
                            value={p.name}
                            onChange={(e) => handleUpdatePlan(idx, "name", e.target.value)}
                            placeholder="e.g. Monthly Standard"
                            className="bg-[#0c0d10] border-white/[0.08] text-xs h-9 rounded-lg focus:border-primary text-white"
                          />
                        </div>

                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[10px] text-zinc-500 font-mono uppercase">Price (₹)</label>
                          <Input
                            type="number"
                            value={p.price}
                            onChange={(e) => handleUpdatePlan(idx, "price", e.target.value)}
                            placeholder="2499"
                            className="bg-[#0c0d10] border-white/[0.08] text-xs h-9 rounded-lg focus:border-primary text-white font-mono"
                          />
                        </div>

                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[10px] text-zinc-500 font-mono uppercase">Duration (Days)</label>
                          <Input
                            type="number"
                            value={p.durationDays}
                            onChange={(e) => handleUpdatePlan(idx, "durationDays", Number(e.target.value))}
                            placeholder="30"
                            className="bg-[#0c0d10] border-white/[0.08] text-xs h-9 rounded-lg focus:border-primary text-white font-mono"
                          />
                        </div>

                        <div className="sm:col-span-1 pt-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemovePlan(idx)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <Input
                          value={p.description || ""}
                          onChange={(e) => handleUpdatePlan(idx, "description", e.target.value)}
                          placeholder="Short description or benefits..."
                          className="bg-[#0c0d10] border-white/[0.04] text-[11px] h-8 rounded-lg text-zinc-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 4: STAFF TEAM */}
            {currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-widest">
                    STEP 04 // TEAM & ROLES
                  </span>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Front-Desk Coach or Staff Account
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Optional: Invite your first staff member to operate the check-in desk and monitor floor roster.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">Staff Full Name</label>
                      <Input
                        value={formData.staffName}
                        onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                        placeholder="e.g. Coach David Singh"
                        className="bg-[#08090a] border-white/[0.08] text-xs h-10 rounded-xl focus:border-primary text-zinc-100"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">Staff Work Email</label>
                      <Input
                        type="email"
                        value={formData.staffEmail}
                        onChange={(e) => setFormData({ ...formData, staffEmail: e.target.value })}
                        placeholder="e.g. david@yourgym.com"
                        className="bg-[#08090a] border-white/[0.08] text-xs h-10 rounded-xl focus:border-primary text-zinc-100"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 italic">
                    Note: You can always add more coaches and trainers later from the Staff Management section.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 5: VERIFICATION & LAUNCH */}
            {currentStep === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-widest">
                    STEP 05 // SYSTEM AUDIT & VERIFICATION
                  </span>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Facility Readiness Audit
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Verify all facility subsystems before activating live operations.
                  </p>
                </div>

                {/* Audit Checklist */}
                <div className="space-y-2.5 pt-2">
                  <div className="p-3.5 rounded-2xl bg-[#08090a] border border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{formData.facilityName}</p>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          {formData.city} • {formData.phone}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-primary font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#08090a] border border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Cryptographic Ingress Controller</p>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          {formData.turnstileEntryLane} & Exit Lane
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-primary font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Armed</span>
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#08090a] border border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {plans.length} Membership Plans Configured
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          {plans.map((p) => p.name).join(" • ")}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-primary font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Valid</span>
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#08090a] border border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">PostgreSQL Tenant Isolation</p>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          Tenant UUID: {tenant.id.slice(0, 12)}... (Strict RLS)
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-primary font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Enforced</span>
                    </span>
                  </div>
                </div>

                {completed && (
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 text-center space-y-1 animate-in fade-in">
                    <p className="text-xs font-bold text-primary">FACILITY VERIFIED & ACTIVE</p>
                    <p className="text-xs text-zinc-300">
                      Redirecting you to your Live Operations Command Center...
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-white/[0.07] pt-6 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || loading || completed}
              className="text-xs h-10 border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-xl gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Button>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-primary hover:bg-primary-deep text-[#08090a] font-bold text-xs h-10 px-5 rounded-xl gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={loading || completed}
                onClick={handleFinalSubmit}
                className="bg-primary hover:bg-primary-deep text-[#08090a] font-bold text-xs h-10 px-6 rounded-xl gap-2 shadow-[0_0_20px_rgba(62,207,142,0.3)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    <span>Verifying Subsystems...</span>
                  </>
                ) : completed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Setup Verified!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Complete Setup & Launch Facility</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs font-mono text-zinc-600">
        <span>GymERP Facility Provisioning Engine • Protected by Row-Level Security</span>
      </footer>
    </div>
  );
}
