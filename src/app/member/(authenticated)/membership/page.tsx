import React from "react";
import { Metadata } from "next";
import { getMemberPortalDataAction } from "@/lib/api/member-portal";
import { MembershipView } from "@/components/portal/membership-view";

export const metadata: Metadata = {
  title: "Membership & Invoices | GymERP",
  description: "View your active fitness membership, amenities, official receipts, and front-desk renewal support",
};

export const dynamic = "force-dynamic";

export default async function MemberMembershipPage() {
  const data = await getMemberPortalDataAction();

  return (
    <div className="animate-in fade-in duration-300">
      <MembershipView
        member={data.member}
        gym={data.gym}
        activeMembership={data.activeMembership}
        memberships={data.memberships}
        recentPayments={data.recentPayments}
      />
    </div>
  );
}
