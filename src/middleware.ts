import { NextRequest, NextResponse } from "next/server";

interface DecodedTokenPayload {
  role?: "platform" | "admin" | "staff";
  tenant_id?: string | null;
  exp?: number;
}

function parseJwtPayload(token: string): DecodedTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = Buffer.from(payload, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("__session")?.value;

  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/platform/login" ||
    pathname === "/portal/login" ||
    pathname === "/api/health" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/manifest") ||
    pathname.includes(".");

  // Public routes always render directly. Never redirect away from /login in middleware
  // to avoid infinite ping-pong loops when server-side tokens are stale/revoked.
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Member Portal protection
  if (pathname.startsWith("/portal")) {
    const memberSession = request.cookies.get("__member_session")?.value;
    if (!memberSession) {
      return NextResponse.redirect(new URL("/portal/login", request.url));
    }
    return NextResponse.next();
  }

  // Protected route requires staff/admin/platform session cookie
  if (!sessionCookie) {
    const target = pathname.startsWith("/platform") ? "/platform/login" : "/login";
    const loginUrl = new URL(target, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = parseJwtPayload(sessionCookie);

  // Check token expiration
  if (!payload || !payload.exp || payload.exp * 1000 <= Date.now()) {
    const target = pathname.startsWith("/platform") ? "/platform/login" : "/login";
    const response = NextResponse.redirect(new URL(target, request.url));
    response.cookies.delete("__session");
    return response;
  }

  const role = payload.role;

  // Role-based route guards
  if (pathname.startsWith("/platform") && !pathname.startsWith("/platform/login") && role !== "platform") {
    return NextResponse.redirect(new URL(role === "admin" ? "/admin" : "/staff", request.url));
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL(role === "platform" ? "/platform" : "/staff", request.url));
  }

  if (pathname.startsWith("/staff") && role !== "staff" && role !== "admin") {
    return NextResponse.redirect(new URL(role === "platform" ? "/platform" : "/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
