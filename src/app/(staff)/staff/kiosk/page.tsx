import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { members, attendance } from "@/lib/db/schema";
import { generateGymRotatingQr } from "@/lib/attendance/qr";
import { desc } from "drizzle-orm";
import { KioskTerminal } from "@/components/kiosk/kiosk-terminal";

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

  // 2. Fetch live tenant members & recent turnstile check-ins
  const data = await withTenantDb(session, async (tx) => {
    const [tenantMembers, recentCheckIns] = await Promise.all([
      tx.select().from(members),
      tx
        .select()
        .from(attendance)
        .orderBy(desc(attendance.checkedInAt))
        .limit(8),
    ]);

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
      defaultMode={mode}
    />
  );
}
