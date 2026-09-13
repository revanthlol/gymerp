"use client";

import React, { useState, useTransition } from "react";
import {
  CreditCard,
  Banknote,
  Globe,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Calendar,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { collectOfflinePaymentAction } from "@/lib/api/payments";

interface PaymentItem {
  id: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  amount: string;
  method: "manual" | "razorpay";
  methodSubtype: string | null;
  status: "paid" | "pending" | "failed";
  razorpayPaymentId: string | null;
  notes: string | null;
  createdAt: string | Date;
  paidAt: string | Date | null;
}

interface MemberOption {
  id: string;
  fullName: string;
  phone: string;
  status: string;
}

interface PlanOption {
  id: string;
  name: string;
  price: string;
  durationDays: number;
}

interface PaymentLedgerProps {
  initialPayments: PaymentItem[];
  members: MemberOption[];
  plans: PlanOption[];
  metrics: {
    totalRevenue: number;
    thisMonthRevenue: number;
    manualRevenue: number;
    onlineRevenue: number;
    totalTransactions: number;
  };
}

export function PaymentLedger({
  initialPayments,
  members,
  plans,
  metrics: initialMetrics,
}: PaymentLedgerProps) {
  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"all" | "manual" | "razorpay">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "failed">("all");

  // Modal State for manual collection
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [amount, setAmount] = useState("");
  const [methodSubtype, setMethodSubtype] = useState<"cash" | "card" | "upi">("cash");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.memberName.toLowerCase().includes(search.toLowerCase()) ||
      p.memberPhone.includes(search) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesMethod = methodFilter === "all" || p.method === methodFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    if (planId) {
      const plan = plans.find((p) => p.id === planId);
      if (plan) setAmount(plan.price);
    }
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedMemberId) {
      setErrorMsg("Please select an athlete/member.");
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setErrorMsg("Please enter a valid payment amount.");
      return;
    }

    startTransition(async () => {
      try {
        const res: any = await collectOfflinePaymentAction({
          memberId: selectedMemberId,
          amount: parseFloat(amount),
          methodSubtype,
          planId: selectedPlanId || undefined,
          notes: notes.trim() || undefined,
        });

        if (res.success && res.payment) {
          const selectedMember = members.find((m) => m.id === selectedMemberId);

          const newPaymentItem: PaymentItem = {
            id: res.payment.id,
            memberId: res.payment.memberId,
            memberName: selectedMember?.fullName || "Member",
            memberPhone: selectedMember?.phone || "",
            amount: res.payment.amount,
            method: "manual",
            methodSubtype: res.payment.methodSubtype,
            status: "paid",
            razorpayPaymentId: null,
            notes: res.payment.notes,
            createdAt: res.payment.createdAt,
            paidAt: res.payment.paidAt,
          };

          setPayments((prev) => [newPaymentItem, ...prev]);

          // Update local metrics
          setMetrics((prev) => ({
            ...prev,
            totalRevenue: prev.totalRevenue + parseFloat(amount),
            thisMonthRevenue: prev.thisMonthRevenue + parseFloat(amount),
            manualRevenue: prev.manualRevenue + parseFloat(amount),
            totalTransactions: prev.totalTransactions + 1,
          }));

          setSuccessMsg(
            `Payment of ₹${parseFloat(amount).toFixed(2)} recorded successfully!`
          );

          // Reset Form
          setTimeout(() => {
            setIsModalOpen(false);
            setSelectedMemberId("");
            setSelectedPlanId("");
            setAmount("");
            setNotes("");
            setSuccessMsg(null);
          }, 1200);
        } else {
          setErrorMsg("Could not record payment. Please try again.");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to record payment");
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
    <div className="space-y-6 w-full">
      {/* Top Header & Collect Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Payments & Settlements
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time financial transactions, physical POS/cash intake, and Razorpay online reconciliations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsModalOpen(true)}
            size="sm"
            className="font-semibold text-xs gap-1.5"
          >
            <Plus className="size-4" />
            <span>Record Payment</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-2 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/25 cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="size-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-bold text-foreground mt-2">
            {formatCurrency(metrics.totalRevenue)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="text-primary font-semibold">{metrics.totalTransactions}</span> settled transactions
          </div>
        </div>

        {/* This Month */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-2 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/25 cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              This Month
            </span>
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="size-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-bold text-primary mt-2">
            {formatCurrency(metrics.thisMonthRevenue)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Current calendar month intake
          </div>
        </div>

        {/* Front-Desk / Cash */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-2 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/25 cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Manual / POS Cash
            </span>
            <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              <Banknote className="size-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-bold text-foreground mt-2">
            {formatCurrency(metrics.manualRevenue)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Desk cash, POS & manual UPI
          </div>
        </div>

        {/* Razorpay Online */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-2 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/25 cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Razorpay Online
            </span>
            <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              <Globe className="size-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-bold text-foreground mt-2">
            {formatCurrency(metrics.onlineRevenue)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            HMAC verified transactions
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-xl border border-border bg-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member, phone, or transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-muted/60 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Method Filter */}
          <div className="flex bg-muted/60 p-1 rounded-lg border border-border">
            {(["all", "manual", "razorpay"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  methodFilter === m
                    ? "bg-card text-foreground shadow-xs font-semibold border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "all" ? "All Methods" : m === "manual" ? "Cash/POS" : "Razorpay"}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex bg-muted/60 p-1 rounded-lg border border-border">
            {(["all", "paid", "pending", "failed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all cursor-pointer ${
                  statusFilter === s
                    ? "bg-card text-foreground shadow-xs font-semibold border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-card/80 backdrop-blur-sm text-muted-foreground text-xs uppercase tracking-wider font-mono border-b border-border">
              <tr>
                <th className="px-5 py-3.5">Member</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Notes / Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    <Receipt className="size-8 text-muted-foreground mx-auto mb-2 opacity-60" />
                    <p className="font-medium">No payment records found</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      {/* Member Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-xs text-foreground">
                            {payment.memberName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {payment.memberName}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {payment.memberPhone}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Method */}
                      <td className="px-5 py-4">
                        {payment.method === "manual" ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Banknote className="size-3.5" />
                            <span>Cash / POS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            <Globe className="size-3.5" />
                            <span>Razorpay</span>
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 font-mono font-bold text-foreground text-base">
                        ₹{parseFloat(payment.amount).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {payment.status === "paid" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3" />
                            <span>Paid</span>
                          </span>
                        )}
                        {payment.status === "pending" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold text-amber-600 dark:text-amber-400">
                            <Clock className="size-3" />
                            <span>Pending</span>
                          </span>
                        )}
                        {payment.status === "failed" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold text-destructive">
                            <XCircle className="size-3" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="px-5 py-4 text-xs font-mono text-muted-foreground">
                        {paidDate.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        <span className="opacity-70">
                          {paidDate.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      {/* Notes / References */}
                      <td className="px-5 py-4 text-xs text-muted-foreground max-w-xs truncate">
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="size-5 text-primary" />
              <span>Record Front-Desk Payment</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Collect cash, card swipe, or manual UPI settlement from a member.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCollectPayment} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              {/* Error & Success alerts */}
              {errorMsg && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-xl flex items-center gap-2">
                  <XCircle className="size-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Select Member */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  Member *
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-muted/60 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
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
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  Membership Plan (Optional Auto-Enrollment)
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted/60 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">No Plan (Custom Payment / Drop-in)</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price} ({p.durationDays} days)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Selecting a plan will automatically activate or extend the member&apos;s subscription.
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold">
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
                    className="w-full pl-8 pr-4 py-2.5 bg-muted/60 border border-border rounded-xl text-sm text-foreground font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Payment Method Subtype */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
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
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "bg-muted/60 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="size-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  Notes / Reference Receipt #
                </label>
                <input
                  type="text"
                  placeholder="e.g. Receipt #4089, UPI ref 429188..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={200}
                  className="w-full px-3.5 py-2 bg-muted/60 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Actions */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="font-semibold px-5 rounded-xl flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    <span>Confirm & Record</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
