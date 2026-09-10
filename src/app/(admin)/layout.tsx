import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AdminSidebar } from "@/components/navigation/admin-sidebar";
import { AdminTopBar } from "@/components/navigation/admin-topbar";
import { AdminPageWrapper } from "@/components/navigation/admin-page-wrapper";
import { AdminContentArea } from "@/components/navigation/admin-content-area";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect(session.role === "platform" ? "/platform" : "/staff");
  }

  if (!session.tenantId) {
    redirect("/login");
  }

  // Fetch tenant info via withTenantDb so RLS tenant policies apply
  let tenant: { name: string; status: string } | undefined;
  try {
    const results = await withTenantDb(session, async (tx) => {
      return await tx
        .select({ name: tenants.name, status: tenants.status })
        .from(tenants)
        .where(eq(tenants.id, session.tenantId!))
        .limit(1);
    });
    tenant = results[0];
  } catch (err) {
    console.error("Failed to query tenant in AdminLayout:", err);
  }

  if (!tenant) {
    redirect("/login");
  }

  if (tenant.status === "suspended") {
    return (
      <div className="min-h-screen bg-[#080809] flex items-center justify-center p-4">
        <div className="glass-panel max-w-md p-8 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-950/50 border border-red-800/50 text-red-400 mx-auto flex items-center justify-center font-bold text-lg">
            !
          </div>
          <h1 className="text-xl font-bold text-white">Tenant Suspended</h1>
          <p className="text-sm text-zinc-400">
            Account access for <span className="text-zinc-200">{tenant.name}</span> has been suspended by the platform administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060a] text-zinc-100 flex">
      {/* Left Sidebar */}
      <AdminSidebar gymName={tenant.name} userEmail={session.email} />

      {/* Main content area — padding adapts to sidebar pin state */}
      <AdminContentArea>
        {/* Sticky top bar */}
        <AdminTopBar gymName={tenant.name} />

        {/* Page content */}
        <main className="flex-1 min-w-0 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8">
          <AdminPageWrapper>{children}</AdminPageWrapper>
        </main>
      </AdminContentArea>
    </div>
  );
}
