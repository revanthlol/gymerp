import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { SessionUser, UserRole } from "@/types/auth";
import { cache } from "react";

const cacheSafe = typeof cache === "function" ? cache : <T extends (...args: any[]) => any>(fn: T): T => fn;

export const getSession = cacheSafe(async function getSession(): Promise<SessionUser | null> {
  let sessionCookie: string | undefined;
  let cookieStore: any;
  try {
    cookieStore = cookies();
    sessionCookie = cookieStore.get("__session")?.value;
  } catch {
    return null;
  }

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    return {
      uid: decoded.uid,
      email: decoded.email || "",
      role: (decoded.role as UserRole) || "staff",
      tenantId: (decoded.tenant_id as string) || null,
      displayName: decoded.name || undefined,
      photoURL: decoded.picture || undefined,
    };
  } catch (error) {
    // Stale or revoked session cookie — purge it
    try {
      cookieStore?.set("__session", "", { path: "/", maxAge: 0 });
    } catch {
      // Ignore if headers already sent
    }
    return null;
  }
});
