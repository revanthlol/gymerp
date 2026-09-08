import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "ID token is required" }, { status: 400 });
    }

    // 5 days session duration
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const decoded = await adminAuth.verifySessionCookie(sessionCookie);

    cookies().set("__session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({
      status: "success",
      user: {
        uid: decoded.uid,
        email: decoded.email,
        role: decoded.role || "staff",
        tenantId: decoded.tenant_id || null,
      },
    });
  } catch (error: any) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Failed to create session cookie: " + (error.message || "Unknown error") },
      { status: 401 }
    );
  }
}
