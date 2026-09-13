import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { members, attendance, tenants } from "@/lib/db/schema";
import { generateGymRotatingQr } from "@/lib/attendance/qr";
import { desc, eq } from "drizzle-orm";
import { getTenantKiosksAction } from "@/lib/api/kiosk";
import { KioskManagementView } from "@/components/admin/kiosk-management-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Turnstiles & Check-In Kiosks | GymERP",
  description: "Manage zero-touch check-in kiosks, digital monitors, and physical turnstiles.",
};

export default async function AdminKioskPage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  // 1. Fetch multi-kiosk stations (auto-seeds default if none exist)
  const [tenantKiosks, initialQr] = await Promise.all([
    getTenantKiosksAction(),
    generateGymRotatingQr(session.tenantId, "auto"),
  ]);

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
          id: tenants.id,
          name: tenants.name,
          slug: tenants.slug,
          logoUrl: tenants.logoUrl,
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
    <KioskManagementView
      initialKiosks={tenantKiosks as any}
      gym={{
        id: data.tenant?.id || session.tenantId,
        name: data.tenant?.name || "Gym",
        slug: data.tenant?.slug || "gym",
        logoUrl: data.tenant?.logoUrl,
      }}
      initialQr={initialQr}
      members={data.members}
      recentAttendance={data.attendance}
    />
  );
}
