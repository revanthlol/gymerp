"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Search,
  Plus,
  ArrowUpRight,
  Wallet,
  Globe,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Banknote,
  Receipt,
  User,
  ShieldCheck,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { recordManualPaymentAction } from "@/lib/api/payments";
import { useRouter } from "next/navigation";

interface PaymentItem {
  id: string;
  tenantId: string;
  memberId: string;
  membershipId: string | null;
  amount: string;
  method: "razorpay" | "manual";
  status: "pending" | "paid" | "failed";
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  notes: string | null;
  paidAt: Date | string | null;
  createdAt: Date | string;
  memberName: string;
  memberEmail: string | null;
  memberPhone: string;
}

interface MemberOption {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  status: string;
}

interface PlanOption {
  id: string;
  name: string;
  price: string;
  durationDays: number;
}

interface Metrics {
  totalRevenue: number;
  manualRevenue: number;
  onlineRevenue: number;
  thisMonthRevenue: number;
  totalTransactions: number;
}

interface PaymentLedgerProps {
  initialPayments: PaymentItem[];
  members: MemberOption[];
  plans: PlanOption[];
  metrics: Metrics;
}

export function PaymentLedger({
  initialPayments,
  members,
  plans,
  metrics,
}: PaymentLedgerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filters
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"all" | "manual" | "razorpay">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "failed">("all");

  // Collect Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [amount, setAmount] = useState("");
  const [methodSubtype, setMethodSubtype] = useState<"cash" | "card" | "upi">("cash");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtered payments
  const filteredPayments = initialPayments.filter((p) => {
    const query = search.toLowerCase().trim();
    const matchesQuery =
      !query ||
      p.memberName.toLowerCase().includes(query) ||
      p.memberPhone.includes(query) ||
      (p.notes && p.notes.toLowerCase().includes(query)) ||
      (p.razorpayPaymentId && p.razorpayPaymentId.toLowerCase().includes(query));

    const matchesMethod = methodFilter === "all" || p.method === methodFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesQuery && matchesMethod && matchesStatus;
  });

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    if (planId) {
      const plan = plans.find((p) => p.id === planId);
      if (plan) {
        setAmount(plan.price);
      }
    }
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedMemberId) {
      setErrorMsg("Please select a gym member");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Please enter a valid payment amount");
      return;
    }

    startTransition(async () => {
      const res = await recordManualPaymentAction({
        memberId: selectedMemberId,
        planId: selectedPlanId || undefined,
        amount: numAmount,
        methodSubtype,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.message || "Failed to record payment");
      } else {
        setSuccessMsg("Payment successfully recorded!");
        setTimeout(() => {
          setIsModalOpen(false);
          setSelectedMemberId("");
          setSelectedPlanId("");
          setAmount("");
          setNotes("");
          setSuccessMsg(null);
          router.refresh();
        }, 1200);
      }
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Collect Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Payments & Settlements
            </h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time financial transactions, physical POS/cash intake, and Razorpay online reconciliations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary-deep text-[#171717] font-medium px-4 py-2 rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-all flex items-center gap-2 border border-primary/30"
          >
            <Plus className="w-4 h-4 text-[#171717] stroke-[3]" />
            <span>Record Payment</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="glass-card p-5 rounded-lg border border-white/[0.08] bg-[#1c1c1c]/90 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-7 h-7 rounded-sm bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-mono">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-extrabold text-white mt-3">
            {formatCurrency(metrics.totalRevenue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
            <span className="text-primary font-semibold">{metrics.totalTransactions}</span> settled transactions
          </div>
        </div>

        {/* This Month */}
        <div className="glass-card p-5 rounded-lg border border-white/[0.08] bg-[#1c1c1c]/90 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              This Month
            </span>
            <div className="w-7 h-7 rounded-sm bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-mono">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-extrabold text-primary mt-3">
            {formatCurrency(metrics.thisMonthRevenue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
            Current calendar month intake
          </div>
        </div>

        {/* Front-Desk / Cash */}
        <div className="glass-card p-5 rounded-lg border border-white/[0.08] bg-[#1c1c1c]/90 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-white/[0.04] rounded-full blur-2xl transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Manual / POS Cash
            </span>
            <div className="w-7 h-7 rounded-sm bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300 font-mono">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-extrabold text-zinc-200 mt-3">
            {formatCurrency(metrics.manualRevenue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
            Desk cash, terminal POS & manual UPI
          </div>
        </div>

        {/* Razorpay Online */}
        <div className="glass-card p-5 rounded-lg border border-white/[0.08] bg-[#1c1c1c]/90 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-white/[0.04] rounded-full blur-2xl transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Razorpay Online
            </span>
            <div className="w-7 h-7 rounded-sm bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300 font-mono">
              <Globe className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-extrabold text-zinc-200 mt-3">
            {formatCurrency(metrics.onlineRevenue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
            HMAC verified webhook transactions
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="glass-panel p-4 rounded-lg border border-white/[0.08] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member, phone, or transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#171717] border border-white/[0.08] rounded-sm text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Method Filter */}
          <div className="flex bg-[#171717] p-1 rounded-sm border border-white/[0.08]">
            {(["all", "manual", "razorpay"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-3 py-1 rounded-sm text-xs font-medium transition-all ${
                  methodFilter === m
                    ? "bg-white/[0.08] text-primary shadow-sm font-semibold border border-white/[0.08]"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {m === "all" ? "All Methods" : m === "manual" ? "Cash/POS" : "Razorpay"}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex bg-[#171717] p-1 rounded-sm border border-white/[0.08]">
            {(["all", "paid", "pending", "failed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-sm text-xs font-medium capitalize transition-all ${
                  statusFilter === s
                    ? "bg-white/[0.08] text-white shadow-sm font-semibold border border-white/[0.08]"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="glass-panel rounded-lg border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-white/[0.02] text-zinc-400 text-xs uppercase tracking-wider font-mono border-b border-white/[0.08]">
              <tr>
                <th className="px-5 py-3.5">Member</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Notes / Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                    <Receipt className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-60" />
                    <p className="font-medium">No payment records found</p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      Adjust your filters or record a new transaction above.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const paidDate = payment.paidAt
                    ? new Date(payment.paidAt)
                    : new Date(payment.createdAt);

                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-zinc-900/40 transition-colors group"
                    >
                      {/* Member Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-bold text-xs text-zinc-300">
                            {payment.memberName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white group-hover:text-brand transition-colors">
                              {payment.memberName}
                            </p>
                            <p className="text-xs text-zinc-500 font-mono">
                              {payment.memberPhone}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Method */}
                      <td className="px-5 py-4">
                        {payment.method === "manual" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-amber-950/40 text-amber-300 border border-amber-800/40">
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Cash / POS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-sky-950/40 text-sky-300 border border-sky-800/40">
                            <Globe className="w-3.5 h-3.5" />
                            <span>Razorpay</span>
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 font-mono font-bold text-white text-base">
                        ₹{parseFloat(payment.amount).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {payment.status === "paid" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid</span>
                          </span>
                        )}
                        {payment.status === "pending" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                        {payment.status === "failed" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <XCircle className="w-3 h-3" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="px-5 py-4 text-xs font-mono text-zinc-400">
                        {paidDate.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        <span className="text-zinc-500">
                          {paidDate.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      {/* Notes / References */}
                      <td className="px-5 py-4 text-xs text-zinc-400 max-w-xs truncate">
                        {payment.notes || payment.razorpayPaymentId || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="glass-panel border-zinc-800 bg-zinc-950/95 text-zinc-100 max-w-md p-6 rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand" />
              <span>Record Front-Desk Payment</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              Collect cash, card swipe, or manual UPI settlement from a member.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCollectPayment} className="space-y-4 mt-2">
            {/* Error & Success alerts */}
            {errorMsg && (
              <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Select Member */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                Member *
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/40"
              >
                <option value="">Select Member...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.phone}) — {m.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Link to Plan (Optional) */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                Membership Plan (Optional Auto-Enrollment)
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/40"
              >
                <option value="">No Plan (Custom Payment / Drop-in)</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.price} ({p.durationDays} days)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-500 mt-1">
                Selecting a plan will automatically activate or extend the member&apos;s subscription.
              </p>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/40"
                />
              </div>
            </div>

            {/* Payment Method Subtype */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                Collection Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cash", label: "Cash", icon: Banknote },
                  { id: "card", label: "POS Card", icon: CreditCard },
                  { id: "upi", label: "Direct UPI", icon: Smartphone },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = methodSubtype === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMethodSubtype(item.id as any)}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                Notes / Reference Receipt #
              </label>
              <input
                type="text"
                placeholder="e.g. Receipt #4089, UPI ref 429188..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/40"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="border-zinc-800 text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary hover:bg-primary-deep text-[#08090a] font-bold px-5 rounded-xl shadow-sm flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Record</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
