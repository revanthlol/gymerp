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
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col relative selection:bg-white/20 selection:text-white">
      {/* Subtle Ambient Glows to enrich frosted glass refraction */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[12%] left-[12%] w-[500px] h-[500px] rounded-full bg-purple-500/[0.03] blur-[140px]" />
        <div className="absolute top-[35%] -right-[10%] w-[450px] h-[450px] rounded-full bg-sky-500/[0.02] blur-[140px]" />
      </div>

      <PlatformNav userEmail={session.email} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 relative z-10">
        {children}
      </main>
    </div>
  );
}
