import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { GymHeader } from "@/components/navigation/gym-header";

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

  // Fetch tenant info
  const [tenant] = await db
    .select({ name: tenants.name, status: tenants.status })
    .from(tenants)
    .where(eq(tenants.id, session.tenantId))
    .limit(1);

  if (!tenant || tenant.status === "suspended") {
    return (
      <div className="min-h-screen bg-[#080809] flex items-center justify-center p-4">
        <div className="glass-panel max-w-md p-8 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-950/50 border border-red-800/50 text-red-400 mx-auto flex items-center justify-center">
            !
          </div>
          <h1 className="text-xl font-bold text-white">Tenant Suspended</h1>
          <p className="text-sm text-zinc-400">
            Account access for <span className="text-zinc-200">{tenant?.name || "this gym"}</span> has been suspended by the platform administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080809] text-zinc-100 flex flex-col">
      <GymHeader gymName={tenant.name} userEmail={session.email} />
      <main className="flex-1 min-w-0 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
