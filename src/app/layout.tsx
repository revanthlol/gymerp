import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { getSession } from "@/lib/auth/session";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/pwa/pwa-register";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: "#080809",
};

export const metadata: Metadata = {
  title: "GymERP — Modern Multi-Tenant Fitness ERP",
  description: "Multi-tenant ERP platform for independent gyms, dojos, and fitness studios.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    shortcut: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-[#080809] text-zinc-100 antialiased relative min-h-screen`}>
        <div className="ambient-glow-mesh" aria-hidden="true" />
        <div className="relative z-10">
          <AuthProvider initialUser={session}>
            <PwaRegister />
            {children}
          </AuthProvider>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
