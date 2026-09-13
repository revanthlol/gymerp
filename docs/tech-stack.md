# GymERP — Technical Stack & Architecture Reference

This document provides the authoritative technical stack reference for GymERP, outlining choices, library versions, and architectural boundaries.

---

## 1. Core Stack Matrix

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Web Framework** | [Next.js (App Router)](https://nextjs.org/) | `14.2.x` | React Server Components, Server Actions, route handlers |
| **API Server** | [Fastify](https://fastify.dev/) | `4.x` | Persistent standalone Node.js server for sub-50ms turnstile verification |
| **Database** | [Neon PostgreSQL](https://neon.tech/) | PostgreSQL 16 | Serverless multi-tenant database with connection pooling |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) | `0.38.x` | Type-safe SQL-like queries with declarative schema migrations |
| **Authentication** | [Firebase Auth](https://firebase.google.com/) | Client SDK `11.x` + Admin `13.x` | JWT custom claims (`role`, `tenant_id`) and secure HTTP-only cookies |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `3.4.x` | Utility classes with CSS custom properties for dual light/dark themes |
| **UI Primitives** | [shadcn/ui](https://ui.shadcn.com/) / [Radix UI](https://www.radix-ui.com/) | Latest | Accessible unstyled primitives customized with semantic tokens |
| **Icons** | [Lucide React](https://lucide.dev/) | Latest | Clean vector SVG icon library |
| **Motion** | [Framer Motion](https://www.framer.com/motion/) | Latest | Fluid micro-interactions, modal transitions, and scanner laser sweep |
| **PWA & Offline** | Serwist / Service Worker | Latest | App shell caching, standalone display mode on tablets |

---

## 2. Multi-Tenant Data Isolation Strategy

GymERP implements a **defense-in-depth** multi-tenancy model across three independent layers:

1. **Application Layer (Drizzle Queries)**:
   - All tenant-specific data queries in `src/lib/api/` and `src/server/` mandate an explicit `where: eq(table.tenantId, tenantId)` filter.
   - Cross-tenant data leakage is prevented at the compile level with TypeScript typing.

2. **Database Layer (PostgreSQL Row-Level Security)**:
   - Tables include RLS policies evaluating `tenant_id = current_setting('app.current_tenant_id', true)::uuid`.
   - The Platform Superadmin has zero RLS access to member PII, attendance, or payment records.

3. **Identity Layer (Firebase Claims)**:
   - Roles (`platform`, `admin`, `staff`, `member`) and associated `tenant_id` are cryptographically signed into Firebase session cookies.
   - Next.js Edge Middleware validates permissions before route rendering.

---

## 3. High-Performance Turnstile & Attendance Engine

To prevent doorway bottlenecks and gym rush-hour latency:
- **Fastify Dedicated Server (`src/server/index.ts`)**:
  - Eliminates serverless cold starts.
  - Maintains pre-warmed database connection pool (`pg.Pool`).
  - Processes attendance QR verification in **under 50 milliseconds**.
- **Dynamic Rotating Anti-Proxy Token**:
  - Generates single-use nonces rotating every 20 seconds.
  - Prevents athletes from screenshotting passes to sneak unregistered friends in.
- **Dead-Phone Keypad Fallback**:
  - Touch-friendly on-screen numeric pad for members whose phones ran out of battery.
  - Front desk verifies photo avatar and status on instant lookup.
