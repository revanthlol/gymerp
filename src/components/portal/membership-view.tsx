"use client";

import React, { useState } from "react";
import {
  CreditCard,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Building2,
  Receipt,
  Download,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MembershipViewProps {
  member: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    status: string;
    joinDate: string;
  };
  gym: {
    name: string;
    slug: string;
    phone: string | null;
    contactEmail: string | null;
  };
  activeMembership: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    planName: string;
    planPrice: string | number;
    durationDays: number;
    daysRemaining: number;
  } | null;
  memberships: any[];
  recentPayments: any[];
}

export function MembershipView({
  member,
  gym,
  activeMembership,
  memberships,
  recentPayments,
}: MembershipViewProps) {
  const [selectedTab, setSelectedTab] = useState<"plan" | "payments">("plan");

  const printReceipt = (payment: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${gym.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; max-width: 600px; margin: auto; }
            .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; }
            .subtitle { color: #666; font-size: 14px; margin-top: 4px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
            .row.bold { font-weight: bold; font-size: 16px; border-top: 1px solid #ddd; padding-top: 12px; margin-top: 16px; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; background: #e5f9e7; color: #1e7e34; font-weight: 600; font-size: 12px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${gym.name}</div>
            <div class="subtitle">Official Payment Receipt &bull; ${gym.contactEmail || "admin@gym.com"}</div>
          </div>
          <div class="row"><span>Receipt ID:</span><span style="font-family: monospace;">#${payment.id.slice(0, 8)}</span></div>
          <div class="row"><span>Athlete:</span><span>${member.fullName}</span></div>
          <div class="row"><span>Member UID:</span><span style="font-family: monospace;">#${member.id.slice(0, 8)}</span></div>
          <div class="row"><span>Payment Date:</span><span>${new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}</span></div>
          <div class="row"><span>Payment Method:</span><span style="text-transform: uppercase;">${payment.method}</span></div>
          <div class="row"><span>Status:</span><span class="badge">PAID</span></div>
          <div class="row bold"><span>Amount Paid:</span><span>$${Number(payment.amount).toFixed(2)}</span></div>
          <div class="footer">
            Thank you for training with ${gym.name}!<br />
            For billing inquiries, please contact ${gym.phone || gym.contactEmail || "reception"}.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Membership Plan & Billing
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage your active fitness contract, payment receipts, and facility renewal status.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-muted rounded-xl text-xs self-start">
          <button
            onClick={() => setSelectedTab("plan")}
            className={cn(
              "px-4 py-1.5 rounded-lg font-semibold transition-all cursor-pointer",
              selectedTab === "plan"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Plan Overview
          </button>
          <button
            onClick={() => setSelectedTab("payments")}
            className={cn(
              "px-4 py-1.5 rounded-lg font-semibold transition-all cursor-pointer",
              selectedTab === "payments"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Invoices & Receipts ({recentPayments.length})
          </button>
        </div>
      </div>

      {selectedTab === "plan" ? (
        <div className="space-y-6">
          {/* Active Plan Card */}
          <div className="relative overflow-hidden rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-primary/10 text-primary">
                    ATHLETE UID: #{member.id.slice(0, 8)}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
                      member.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                    )}
                  >
                    {member.status} Contract
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  {activeMembership?.planName || "Active Training Membership"}
                </h2>

                <p className="text-xs sm:text-sm text-muted-foreground max-w-lg">
                  Registered with {gym.name}. Includes 24/7 turnstile access, digital locker access, and all group fitness classes.
                </p>

                {/* Key metadata chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                  <div className="p-3 rounded-xl bg-muted/50 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block uppercase font-mono">Plan Fee</span>
                    <span className="text-base font-bold text-foreground">
                      ${activeMembership ? Number(activeMembership.planPrice).toFixed(2) : "0.00"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/50 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block uppercase font-mono">Remaining</span>
                    <span className="text-base font-bold text-primary">
                      {activeMembership?.daysRemaining ?? 0} Days
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/50 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block uppercase font-mono">Start Date</span>
                    <span className="text-xs font-medium text-foreground">
                      {activeMembership?.startDate
                        ? new Date(activeMembership.startDate).toLocaleDateString()
                        : member.joinDate}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/50 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block uppercase font-mono">Expires On</span>
                    <span className="text-xs font-medium text-foreground">
                      {activeMembership?.endDate
                        ? new Date(activeMembership.endDate).toLocaleDateString()
                        : "Ongoing"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plan Perks checklist */}
              <div className="w-full md:w-72 p-5 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  Included Amenities
                </span>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Zero-touch turnstile camera entry</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Unlimited group fitness classes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Complimentary locker room access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Digital workout streak ledger</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Front-Desk Reception & Renewal Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Front Desk Support */}
            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Front-Desk Reception</h3>
                  <p className="text-xs text-muted-foreground">Have questions or need to renew your pass?</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {gym.phone && (
                  <a
                    href={`tel:${gym.phone}`}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 text-foreground transition-colors"
                  >
                    <Phone className="w-4 h-4 text-primary" />
                    <span>{gym.phone}</span>
                  </a>
                )}
                {gym.contactEmail && (
                  <a
                    href={`mailto:${gym.contactEmail}`}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 text-foreground transition-colors"
                  >
                    <Mail className="w-4 h-4 text-primary" />
                    <span>{gym.contactEmail}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Contract History */}
            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground">Membership History</h3>
              <div className="space-y-2.5">
                {memberships.slice(0, 3).map((m: any) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-foreground">{m.planName}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {new Date(m.startDate).toLocaleDateString()} &rarr; {new Date(m.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                        m.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Payment Ledger Tab */
        <div className="rounded-3xl bg-card border border-border/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border/60 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <span>Official Payment Ledger & Receipts</span>
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              Total Recorded: {recentPayments.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-sans">
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No payment invoices recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentPayments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                        #{p.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {new Date(p.paidAt || p.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-mono uppercase text-muted-foreground">
                        {p.method}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {p.status || "Paid"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground font-mono">
                        ${Number(p.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => printReceipt(p)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-medium text-xs transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
