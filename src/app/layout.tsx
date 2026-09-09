import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { getSession } from "@/lib/auth/session";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "GymERP — Modern Multi-Tenant Fitness ERP",
  description: "Multi-tenant ERP platform for independent gyms, dojos, and fitness studios.",
  icons: {
    icon: "/favicon.ico",
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
      <body className={`${inter.variable} font-sans bg-[#080809] text-zinc-100 antialiased`}>
        <AuthProvider initialUser={session}>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
