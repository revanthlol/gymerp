import React from "react";
import { notFound } from "next/navigation";
import { getPublicKioskDataAction } from "@/lib/api/kiosk";
import { PublicKioskView } from "@/components/kiosk/public-kiosk-view";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

interface KioskSlugPageProps {
  params: { slug: string };
  searchParams: { mode?: "entry" | "exit" | "auto" };
}

export async function generateMetadata({ params }: KioskSlugPageProps): Promise<Metadata> {
  return {
    title: `Check-In Kiosk | GymERP`,
    description: `Public front-desk check-in kiosk station for gym members`,
  };
}

export default async function KioskSlugPage({ params, searchParams }: KioskSlugPageProps) {
  const mode = searchParams.mode === "exit" ? "exit" : "entry";
  const data = await getPublicKioskDataAction(params.slug, mode);

  if (data.error || !data.gym) {
    notFound();
  }

  return (
    <PublicKioskView
      gym={data.gym}
      initialQr={data.initialQr}
      isUnlocked={Boolean(data.unlocked)}
    />
  );
}
