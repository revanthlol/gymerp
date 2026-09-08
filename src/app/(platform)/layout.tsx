import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { PlatformNav } from "@/components/navigation/platform-nav";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "platform") {
    redirect(session.role === "admin" ? "/admin" : "/staff");
  }

  return (
    <div className="min-h-screen bg-[#080809] text-zinc-100 flex flex-col">
      <PlatformNav userEmail={session.email} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
