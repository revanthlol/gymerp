import React from "react";
import { getTenantPaymentsAction } from "@/lib/api/payments";
import { PaymentLedger } from "@/components/payments/payment-ledger";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments & Financial Ledger | GymERP",
  description: "Real-time gym financial ledger, cash settlements, and online payment tracking",
};

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const data = await getTenantPaymentsAction();

  return (
    <div className="space-y-6">
      <PaymentLedger
        initialPayments={data.payments as any}
        members={data.members}
        plans={data.plans}
        metrics={data.metrics}
      />
    </div>
  );
}
