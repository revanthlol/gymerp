import { Metadata } from "next";
import { getKioskStationDataAction } from "@/lib/api/kiosk";
import { generateKioskStationQr } from "@/lib/attendance/qr";
import { StationDisplay } from "@/components/kiosk/station-display";
import { AlertCircle, ShieldAlert, Dumbbell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Turnstile Station | GymERP",
  description: "Dedicated zero-touch gym attendance kiosk station.",
};

interface KioskStationPageProps {
  searchParams: {
    token?: string;
  };
}

export default async function KioskStationPage({ searchParams }: KioskStationPageProps) {
  const token = searchParams.token;

  if (!token) {
    return (
      <div className="min-h-screen bg-[#07080a] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0e1014] border border-white/10 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Kiosk Token Required</h1>
            <p className="text-sm text-zinc-400">
              This zero-touch display requires a secure station access token in the URL.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-zinc-400 text-left">
            Usage: <span className="text-emerald-400">/kiosk/station?token=[secretToken]</span>
          </div>
          <Link href="/login">
            <Button variant="outline" className="w-full h-11 border-white/10 hover:bg-white/5 text-xs font-semibold">
              Gym Administrator Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const data = await getKioskStationDataAction(token);

  if (!data || data.error || !data.kiosk || !data.gym) {
    return (
      <div className="min-h-screen bg-[#07080a] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0e1014] border border-red-500/20 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Station Deactivated or Invalid</h1>
            <p className="text-sm text-zinc-400">
              {data?.error || "This kiosk access token is unrecognized or was revoked by the administrator."}
            </p>
          </div>
          <p className="text-xs text-zinc-500">
            Please verify the display link in your Gym Admin Dashboard under Check-In Kiosks.
          </p>
        </div>
      </div>
    );
  }

  // Generate static QR code for this specific kiosk station
  const qr = await generateKioskStationQr(data.kiosk.slug, data.kiosk.secretToken, data.kiosk.mode);

  return (
    <StationDisplay
      kiosk={data.kiosk}
      gym={data.gym}
      qrDataUrl={qr.qrDataUrl}
      scanUrl={qr.scanUrl}
    />
  );
}
