import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { withTenantDb } from "@/lib/db/tenant";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DashboardShell } from "@/components/navigation/dashboard-shell";

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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card max-w-md p-8 rounded-xl border border-border text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive mx-auto flex items-center justify-center font-bold text-lg">
            !
          </div>
          <h1 className="text-xl font-bold text-foreground">Tenant Suspended</h1>
          <p className="text-sm text-muted-foreground">
            Account access for <span className="text-foreground font-semibold">{tenant.name}</span> has been suspended by the platform administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell gymName={tenant.name} userEmail={session.email}>
      {children}
    </DashboardShell>
  );
}
