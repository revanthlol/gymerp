import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { members, attendance } from "@/lib/db/schema";
import { generateGymRotatingQr } from "@/lib/attendance/qr";
import { desc } from "drizzle-orm";
import { KioskTerminal } from "@/components/kiosk/kiosk-terminal";

export const dynamic = "force-dynamic";

export default async function KioskPage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  // 1. Generate live dynamic 2-hour rotating QR code
  const initialQr = await generateGymRotatingQr(session.tenantId);

  // 2. Fetch live tenant members & recent turnstile check-ins
  const data = await withTenantDb(session, async (tx) => {
    const tenantMembers = await tx.select().from(members);
    const recentCheckIns = await tx
      .select()
      .from(attendance)
      .orderBy(desc(attendance.checkedInAt))
      .limit(8);

    return {
      members: tenantMembers,
      attendance: recentCheckIns,
    };
  });

  return (
    <KioskTerminal
      initialQr={initialQr}
      members={data.members}
      recentAttendance={data.attendance}
    />
  );
}
