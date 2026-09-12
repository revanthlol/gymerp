import { getSession } from "@/lib/auth/session";
import { LandingPage } from "@/components/landing/landing-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GymERP | Easy Door Check-In & Gym Management",
  description:
    "Run your gym smoothly and stop pass sharing. Instant phone check-in at the front desk, automatic expired membership warnings, and complete member management.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  return <LandingPage session={session} />;
}
