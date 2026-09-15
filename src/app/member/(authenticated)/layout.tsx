import React from "react";
import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/auth/member-session";
import { db } from "@/lib/db";
import { members, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PortalShell } from "@/components/portal/portal-shell";

export const dynamic = "force-dynamic";

export default async function MemberPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getMemberSession();

  if (!session) {
    redirect("/member/login");
  }

  // Fetch Member and Gym Tenant details
  const [memberRows, tenantRows] = await Promise.all([
    db
      .select({
        id: members.id,
        fullName: members.fullName,
        email: members.email,
        phone: members.phone,
        status: members.status,
      })
      .from(members)
      .where(eq(members.id, session.memberId))
      .limit(1),

    db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        logoUrl: tenants.logoUrl,
        phone: tenants.phone,
        contactEmail: tenants.contactEmail,
      })
      .from(tenants)
      .where(eq(tenants.id, session.tenantId))
      .limit(1),
  ]);

  const member = memberRows[0];
  const gym = tenantRows[0] || {
    id: session.tenantId,
    name: "IronPulse Fitness",
    slug: "ironpulse",
    logoUrl: null,
    phone: "+1 (555) 019-2834",
    contactEmail: "admin@ironpulse.local",
  };

  if (!member) {
    redirect("/member/login");
  }

  return (
    <PortalShell member={member} gym={gym}>
      {children}
    </PortalShell>
  );
}
