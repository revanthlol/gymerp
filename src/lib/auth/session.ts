import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { SessionUser, UserRole } from "@/types/auth";

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email || "",
      role: (decoded.role as UserRole) || "staff",
      tenantId: (decoded.tenant_id as string) || null,
      displayName: decoded.name || undefined,
      photoURL: decoded.picture || undefined,
    };
  } catch (error) {
    // Session cookie invalid or revoked
    return null;
  }
}
