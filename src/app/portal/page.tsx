import React from "react";
import { getMemberPortalDataAction } from "@/lib/api/member-portal";
import { MemberPortalView } from "@/components/portal/member-portal-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Pass & Portal | GymERP",
  description: "Access your digital athlete pass, active memberships, and workout activity",
};

export const dynamic = "force-dynamic";

export default async function MemberPortalPage() {
  const data = await getMemberPortalDataAction();

  return <MemberPortalView data={data as any} />;
}
