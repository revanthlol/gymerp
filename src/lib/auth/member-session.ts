import { cookies } from "next/headers";
import crypto from "crypto";
import { cache } from "react";

export interface MemberSession {
  memberId: string;
  tenantId: string;
  fullName: string;
  phone: string;
  email: string | null;
  qrToken: string;
}

const SECRET =
  process.env.COOKIE_SECRET ||
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  "gym-member-session-salt-super-secure";

export function signMemberToken(payload: MemberSession): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyMemberToken(token: string): MemberSession | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, sig] = parts;

    const expectedSig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");

    const bufSig = Buffer.from(sig);
    const bufExp = Buffer.from(expectedSig);

    if (bufSig.length !== bufExp.length) return null;
    if (!crypto.timingSafeEqual(bufSig, bufExp)) return null;

    const json = Buffer.from(data, "base64url").toString("utf-8");
    return JSON.parse(json) as MemberSession;
  } catch {
    return null;
  }
}

export const getMemberSession = cache(async function getMemberSession(): Promise<MemberSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("__member_session")?.value;
  if (!token) return null;

  const session = verifyMemberToken(token);
  if (!session) {
    try {
      cookieStore.set("__member_session", "", { path: "/", maxAge: 0 });
    } catch {}
    return null;
  }
  return session;
});
