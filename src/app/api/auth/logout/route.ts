import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie);
      await adminAuth.revokeRefreshTokens(decoded.uid);
    } catch {
      // Ignore token revocation failure for expired cookies
    }
  }

  cookieStore.delete("__session");

  return NextResponse.json({ status: "success", message: "Logged out" });
}
