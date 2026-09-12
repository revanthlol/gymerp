import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { members, attendance, tenants } from "@/lib/db/schema";
import { generateGymRotatingQr } from "@/lib/attendance/qr";
import { desc, eq } from "drizzle-orm";
import { KioskTerminal } from "@/components/kiosk/kiosk-terminal";
import { KioskShareCard } from "@/components/kiosk/kiosk-share-card";

export const dynamic = "force-dynamic";

interface StaffKioskPageProps {
  searchParams: { mode?: "entry" | "exit" | "auto" };
}

export default async function KioskPage({ searchParams }: StaffKioskPageProps) {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const mode = searchParams.mode || "entry";

  // 1. Generate live dynamic rotating QR code with mode
  const initialQr = await generateGymRotatingQr(session.tenantId, mode);

  // 2. Fetch live tenant members, recent turnstile check-ins, and tenant settings
  const data = await withTenantDb(session, async (tx) => {
    const [tenantMembers, recentCheckIns, [tenantRecord]] = await Promise.all([
      tx.select().from(members),
      tx
        .select()
        .from(attendance)
        .orderBy(desc(attendance.checkedInAt))
        .limit(8),
      tx
        .select({
          slug: tenants.slug,
          kioskPassphrase: tenants.kioskPassphrase,
        })
        .from(tenants)
        .where(eq(tenants.id, session.tenantId!))
        .limit(1),
    ]);

    return {
      members: tenantMembers,
      attendance: recentCheckIns,
      tenant: tenantRecord,
    };
  });

  return (
    <div className="space-y-6">
      {data.tenant && (
        <KioskShareCard
          gymSlug={data.tenant.slug}
          initialPassphrase={data.tenant.kioskPassphrase || "123456"}
        />
      )}

      <KioskTerminal
        initialQr={initialQr}
        members={data.members}
        recentAttendance={data.attendance}
        defaultMode={mode}
      />
    </div>
  );
}
