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
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".");

  if (isPublicRoute) {
    if (pathname === "/login" && sessionCookie) {
      const payload = parseJwtPayload(sessionCookie);
      if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
        const role = payload.role;
        if (role === "platform") return NextResponse.redirect(new URL("/platform", request.url));
        if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url));
        if (role === "staff") return NextResponse.redirect(new URL("/staff", request.url));
      }
    }
    return NextResponse.next();
  }

  // Protected route requires session cookie
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = parseJwtPayload(sessionCookie);

  // Check token expiration
  if (!payload || !payload.exp || payload.exp * 1000 <= Date.now()) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("__session");
    return response;
  }

  const role = payload.role;

  // Role-based route guards
  if (pathname.startsWith("/platform") && role !== "platform") {
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
