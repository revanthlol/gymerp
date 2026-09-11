import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getTenantOnboardingStatusAction } from "@/lib/api/onboarding";
import { OnboardingWizard } from "@/components/admin/onboarding-wizard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facility Onboarding Setup | GymERP Admin",
  description: "Initial facility profile, turnstiles, and membership plan configuration wizard",
};

export const dynamic = "force-dynamic";

export default async function AdminOnboardingPage() {
  const session = await getSession();
  if (!session || !session.tenantId || session.role !== "admin") {
    redirect("/login");
  }

  const data = await getTenantOnboardingStatusAction();
  if (!data.tenant) {
    redirect("/login");
  }

  return (
    <OnboardingWizard
      tenant={data.tenant as any}
      existingPlansCount={data.plansCount}
    />
  );
}
