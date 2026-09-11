import { getSession } from "@/lib/auth/session";
import { LandingPage } from "@/components/landing/landing-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GymERP | Physical Operations. Zero Friction.",
  description:
    "Modern obsidian-crafted gym ERP with sub-40ms turnstile access, automated revenue ledgers, and group class scheduling.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  return <LandingPage session={session} />;
}
