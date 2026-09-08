# GymERP — Tech Stack Reference

> **Architecture Model:**
> - **Application & UI:** Next.js 14+ (App Router) deployed permanently to Vercel (or Node container on VM).
> - **Identity & Access:** Firebase Auth with HTTP-only Session Cookies (`__session`) and custom user claims (`role`, `tenant_id`).
> - **Database:** PostgreSQL 16 managed via Docker Compose locally and deployed on a dedicated Linux VPS (EC2/Hetzner/Oracle) with automated daily backups.
> - **Data Access & Schema:** Drizzle ORM + Drizzle Kit with type-safe schema declarations.
> - **Multi-Tenant Security:** Defense-in-depth: Application-layer tenant scoping via Drizzle repository wrappers + PostgreSQL Row-Level Security (RLS) policies enforcing `SET LOCAL app.current_tenant_id`.
> - **File Storage:** Firebase Storage with security rules enforcing tenant boundaries for member avatars and gym branding assets.

---

## Frontend

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | RSC for data-heavy dashboard pages, streaming/Suspense, PWA-compatible |
| UI primitives | **shadcn/ui** (installed via CLI) | Full customization control; components added incrementally |
| Styling | **Tailwind CSS v4** | CSS variables for theme tokens; glassmorphism/glow via CSS, not a lib |
| State (client) | **Zustand** | Auth context (role, tenant_id, user), accent theme, sidebar state |
| Data tables | **TanStack Table v8** + shadcn `<Table>` | Sortable, filterable, paginated — one reusable `<DataTable>` built in Phase 1 |
| Forms | **react-hook-form + Zod** + shadcn `<Form>` | One form pattern built in Phase 1, reused everywhere |
| PWA | **Serwist** (`@serwist/next`) | Service worker caches **app shell only** (JS/CSS/fonts/icons). Never caches API/database responses |
| Font | **Inter** (primary) + **JetBrains Mono** (metrics, IDs, prices) | Loaded via `next/font/google` |
| Icons | **Lucide React** | Consistent, sharp SVG vector icon set |
| QR scanning | **html5-qrcode** or **zxing-js/browser** | Browser-camera QR decode on `/staff/checkin` and `/staff/kiosk` |
| Hosting | **Vercel** (permanent) | Edge-optimized, zero config for Next.js, stays here even with VM database |

---

## Backend & API

All server-side logic lives in **Next.js Server Actions** and **Route Handlers**, structured into clean modular services in `src/lib/api/`.

| Concern | Choice | Notes |
|---|---|---|
| API layer | Next.js Server Actions (mutations) + Drizzle ORM (queries) | High developer velocity, type-safe RPC |
| Modular services | `src/lib/api/` modules | Pure business logic functions decoupled from Next.js request objects |
| Webhook handler | Next.js Route Handler (`/api/webhooks/payments`) | Verifies provider HMAC signature before executing mutations |
| Optional Standalone API | **Hono** (Bun / Node 22+) | Optional future containerized microservice; consumes existing `src/lib/api/` modules |
| Reverse proxy | **Nginx** | TLS termination for PostgreSQL VPS or standalone API server |

---

## Database & Multi-Tenancy

| Concern | Choice | Notes |
|---|---|---|
| Database Engine | **PostgreSQL 16** | Running in Docker Compose locally (`postgres:16-alpine`) and on dedicated Linux VPS |
| ORM / Query Layer | **Drizzle ORM** | Zero-overhead, type-safe SQL-like queries with Drizzle schema relations |
| Migrations Tooling | **Drizzle Kit** | Generates SQL migrations; executes migrations via `pnpm db:migrate` |
| Multi-Tenant Layer 1 | **Drizzle Repository Wrapper** | Injects `where: eq(table.tenantId, tenantId)` on all tenant queries |
| Multi-Tenant Layer 2 | **PostgreSQL RLS** | Enforces `tenant_id = current_setting('app.current_tenant_id', true)::uuid` via `SET LOCAL` |
| Storage | **Firebase Storage** | Tenant-scoped security rules for member photos and gym logos |

### Core Schema (Entities)
`tenants`, `users`, `members`, `membership_plans`, `memberships`, `payments`, `attendance`

### RLS Hard Rule
> Platform Superadmin role has **zero** RLS path to `members`, `payments`, `attendance`, `memberships`, `membership_plans`. Enforced at the PostgreSQL engine level — never dependent on UI filtering alone.

---

## Auth & Access Control

| Tier | Role | Scope | Database Access |
|---|---|---|---|
| Platform Superadmin | `platform` | Global | CRUD on `tenants` table only. Cannot query member PII or financial rows. |
| Gym Admin | `admin` | Single Tenant | Full CRUD within assigned `tenant_id`. |
| Front-Desk Staff | `staff` | Single Tenant | Member CRUD, check-in kiosk operations, manual payments. Cannot modify membership plan pricing. |
| Gym Member | End User | Single Tenant | Unauthenticated database entity with unique `qr_token` for kiosk scanning. |

- **Identity Provider:** Firebase Auth (Email/Password).
- **Custom Claims:** Injected via Firebase Admin SDK upon account provisioning:
  ```json
  {
    "role": "platform" | "admin" | "staff",
    "tenant_id": "uuid-string" | null
  }
  ```
- **Session Strategy:** Next.js Route Handler `/api/auth/session` exchanges Firebase ID token for an HTTP-only, secure, `sameSite: 'lax'` session cookie (`__session`). Server Components read verified claims directly without client roundtrips.

---

## Payments

| Concern | Choice | Notes |
|---|---|---|
| Payment gateway | **Abstracted** behind a `PaymentProvider` interface | Razorpay default implementation; swappable to Stripe |
| Webhook handling | Next.js Route Handler (`/api/webhooks/payments`) | Verifies cryptographic HMAC-SHA256 signature |
| Payment records | Stored in `payments` table | Includes provider payment ID, order ID, amount, method, status |
| Subscription billing | Modeled in `memberships` table | Tracks `start_date`, `end_date`, `status` (`active`, `expired`, `cancelled`) |

> **`PaymentProvider` Interface:**
> `createOrder(params: CreateOrderParams): Promise<PaymentOrder>`
> `verifyWebhook(payload: string, signature: string): boolean`
> `refund(paymentId: string, amount: number): Promise<RefundResult>`

---

## Notifications

| Concern | Choice | Notes |
|---|---|---|
| Member notifications | **WhatsApp Business API** | High engagement in gym & fitness market |
| Provider | **Twilio / Gupshup / Wati** | Abstracted behind `NotificationProvider` interface |
| Triggers | Membership expiration alerts, renewal receipts, welcome QR codes | Triggered via background worker / cron runner |
| In-App Alerts | Toast notifications & live badges | Sonner / shadcn toast components |

---

## Testing & Quality Assurance

| Type | Tooling | Scope |
|---|---|---|
| Unit & Integration | **Vitest** + **React Testing Library** | Business logic services, tenant repository wrappers, UI components |
| Multi-Tenant Boundary Tests | **Custom Vitest PostgreSQL Suite** | Verifies RLS blocks cross-tenant access and platform role leakage |
| E2E Testing | **Playwright** | Critical user journeys: login redirect, QR check-in, member creation, webhook handling |
| Static Analysis | **TypeScript strict** + **ESLint** + **Zod** | Type validation at all network and database boundaries |

---

## Monitoring & Observability

| Concern | Choice |
|---|---|
| Error Tracking | **Sentry** (Next.js SDK) |
| Performance Monitoring | Vercel Analytics + Core Web Vitals |
| Database Metrics | PostgreSQL `pg_stat_statements` + container healthchecks |
| Container Logs | Docker Compose journal / Vector to cloud log aggregator |

---

## CI/CD Pipeline

| Pipeline Stage | Implementation |
|---|---|
| Version Control | GitHub Repository with branch protection rules |
| Lint & Typecheck | GitHub Actions workflow on pull requests (`pnpm lint`, `pnpm typecheck`) |
| DB Migration Test | GitHub Actions runs test PostgreSQL container and executes `pnpm db:migrate` |
| Frontend Deployment | Vercel auto-deploy on push to `main` |
| VPS DB Deployment | Automated SSH runner applying `docker compose pull && pnpm db:migrate` |
