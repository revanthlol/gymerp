# Phase 1 — Web: Dashboard Shell, Firebase Auth & PWA Scaffold

> **Scope:**
> Establish the production frontend foundation: Next.js 14+ App Router, Firebase Auth session management via HTTP-only cookies, role-gated route guards, shared layout shells, reusable `<DataTable>` and form patterns, and the Serwist PWA app-shell precaching engine.

---

## 1. System Architecture & Auth Lifecycle

In Next.js 14 App Router, authentication uses **Firebase HTTP-only Session Cookies** to enable server-side rendering (RSC) without client layout flash.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant Login as /login (Client Component)
    participant SDK as Firebase Client SDK
    participant API as /api/auth/session (Route Handler)
    participant Admin as Firebase Admin SDK
    participant RSC as Server Component / Layout

    User->>Login: Submit email & password
    Login->>SDK: signInWithEmailAndPassword(email, pass)
    SDK-->>Login: UserCredential + ID Token
    Login->>API: POST /api/auth/session { idToken }
    API->>Admin: createSessionCookie(idToken, { expiresIn: 5 days })
    Admin-->>API: Cryptographic Session Cookie (__session)
    API-->>Login: 200 OK + Set-Cookie: __session; HttpOnly; Secure; SameSite=Lax
    Login->>User: router.push(roleDashboardUrl)
    User->>RSC: Request GET /admin
    RSC->>Admin: verifySessionCookie(cookie)
    Admin-->>RSC: Decoded Claims { role: "admin", tenant_id: "..." }
    RSC-->>User: Rendered Dashboard HTML (Zero Flash)
```

---

## 2. Directory Structure (`src/`)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx            # Client login form with role demo quick-switcher
│   │   └── layout.tsx
│   ├── (platform)/
│   │   ├── platform/
│   │   │   ├── page.tsx            # Platform superadmin overview
│   │   │   └── tenants/
│   │   └── layout.tsx              # Platform header shell (global scope)
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── page.tsx            # Gym admin overview & metrics
│   │   │   ├── members/
│   │   │   ├── plans/
│   │   │   └── settings/
│   │   └── layout.tsx              # Admin sidebar & header shell (tenant scope)
│   ├── (staff)/
│   │   ├── staff/
│   │   │   ├── page.tsx            # Front-desk action hub
│   │   │   ├── checkin/
│   │   │   └── kiosk/
│   │   └── layout.tsx              # Staff streamlined touch-friendly shell
│   ├── api/
│   │   └── auth/
│   │       ├── session/route.ts    # Creates session cookie from ID token
│   │       └── logout/route.ts     # Destroys cookie & revokes token
│   ├── layout.tsx                  # Root layout: fonts, providers, toast
│   └── globals.css                 # Tailwind v4 variables & glass tokens
├── components/
│   ├── ui/                         # shadcn/ui primitives
│   ├── shared/
│   │   ├── data-table.tsx          # Reusable TanStack Table component
│   │   ├── modal-form.tsx          # Reusable Dialog + Zod form wrapper
│   │   └── stat-card.tsx           # Dashboard metric widget with sparkline/delta
│   └── navigation/
│       ├── platform-nav.tsx
│       ├── admin-sidebar.tsx
│       └── staff-header.tsx
├── lib/
│   ├── firebase/
│   │   ├── client.ts               # Client Firebase SDK singleton
│   │   └── admin.ts                # Server Firebase Admin SDK singleton
│   ├── auth/
│   │   ├── session.ts              # Server cookie reader & claim extractor
│   │   └── context.tsx             # Client auth state provider
│   └── db/
│       └── index.ts                # Drizzle database client
└── middleware.ts                   # Edge route protection & role redirection
```

---

## 3. Session Route Handlers (`src/app/api/auth/`)

### 3.1 Session Creation (`src/app/api/auth/session/route.ts`)
```typescript
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    cookies().set("__session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    // Extract claims to guide client redirection
    const decoded = await adminAuth.verifySessionCookie(sessionCookie);

    return NextResponse.json({
      status: "success",
      role: decoded.role,
      tenantId: decoded.tenant_id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}
```

### 3.2 Session Teardown (`src/app/api/auth/logout/route.ts`)
```typescript
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST() {
  const session = cookies().get("__session")?.value;
  if (session) {
    try {
      const decoded = await adminAuth.verifySessionCookie(session);
      await adminAuth.revokeRefreshTokens(decoded.sub);
    } catch {
      // Ignore invalid or already expired cookie
    }
  }

  cookies().delete("__session");
  return NextResponse.json({ status: "logged_out" });
}
```

---

## 4. Middleware Route Protection (`src/middleware.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("__session")?.value;

  const isPublicRoute =
    pathname === "/login" ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".");

  if (isPublicRoute) {
    if (session && pathname === "/login") {
      // Decode lightweight claims or redirect to home to evaluate destination
      return NextResponse.next();
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/webhooks|_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 5. Reusable `<DataTable>` Pattern (`src/components/shared/data-table.tsx`)

Built once in Phase 1 with **TanStack Table v8** and reused across all platform, member, payment, and attendance listings:

```typescript
"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search records...",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  });

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="flex items-center justify-between">
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="max-w-sm bg-zinc-900 border-zinc-800"
          />
        </div>
      )}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-900/90">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-zinc-800">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-zinc-400 font-mono text-xs uppercase">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-zinc-800/60 hover:bg-zinc-800/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-zinc-200">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-zinc-500">
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
```

---

## 6. Serwist PWA App Shell Engine

Serwist (`@serwist/next`) is configured to precache static assets (JS, CSS, fonts, icons) while **strictly bypassing all API and database requests**:

```javascript
// next.config.mjs
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist({
  reactStrictMode: true,
});
```

```typescript
// src/app/sw.ts
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  // CRITICAL: Explicitly ensure API routes and mutations are NEVER cached by the SW
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
```

---

## 7. Phase 1 Exit Criteria

- [ ] Firebase Client SDK correctly signs in users on `/login`.
- [ ] Next.js Route Handler `/api/auth/session` successfully issues `__session` HTTP-only cookie.
- [ ] Middleware blocks unauthenticated requests and routes users based on their role:
  - `platform` -> `/platform`
  - `admin` -> `/admin`
  - `staff` -> `/staff`
- [ ] Role crossover protection verified: `admin` cannot visit `/platform`; `staff` cannot visit `/admin`.
- [ ] Reusable `<DataTable>` renders live data from `tenants` table with sorting, filtering, and pagination.
- [ ] Serwist PWA registers, installs locally, and browser DevTools confirms zero API/DB queries exist in cache storage.
