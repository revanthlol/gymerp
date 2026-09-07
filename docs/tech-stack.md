# GymERP — Tech Stack Reference

> **Two-phase model:**
> - **Phase A (Build):** Supabase-managed \u2014 fast to iterate, zero infra ops.
> - **Phase B (Production):** Migrate to self-hosted VM (EC2/Oracle) with Docker Compose. Frontend stays on Vercel permanently.
>
> Every abstraction below is chosen so Phase A → Phase B is a **config swap**, not a rewrite.

---

## Frontend

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | RSC for data-heavy dashboard pages, streaming/Suspense, PWA-compatible |
| UI primitives | **shadcn/ui** (installed via CLI, not a starter fork) | Full customization control; components added incrementally |
| Styling | **Tailwind CSS v4** | CSS variables for theme tokens; glassmorphism/glow via CSS, not a lib |
| State (client) | **Zustand** | Auth context (role, tenant\_id, user), accent theme, sidebar state |
| Data tables | **TanStack Table v8** + shadcn `<Table>` | Sortable, filterable, paginated — one reusable `<DataTable>` built in Phase 1 |
| Forms | **react-hook-form + Zod** + shadcn `<Form>` | One form pattern built in Phase 1, reused everywhere |
| PWA | **Serwist** (`@serwist/next`) | Service worker caches **app shell only** (JS/CSS/fonts/icons). Never caches API/Supabase responses |
| Font | **Inter** (primary) + one display/heading variant for visual hierarchy | Via `next/font/google` |
| Icons | **Lucide React** | Consistent icon set across shadcn/ui |
| QR scanning | **html5-qrcode** or **zxing-js/browser** | Browser-camera QR decode on `/staff/checkin` |
| Hosting | **Vercel** (permanent) | Edge-optimized, zero config for Next.js, stays here even in Phase B |

---

## Backend

### Phase A — Supabase-only (initial build)

All server-side logic lives in **Next.js Server Actions** and **API Routes**. No custom backend server.

| Concern | Choice |
|---|---|
| API layer | Next.js Server Actions (mutations) + Supabase JS client (queries) |
| Webhook handler | Next.js API Route (`/api/webhooks/payments`) |
| Business logic | Co-located with Server Actions in the Next.js app |

### Phase B — VM (production)

| Concern | Choice | Notes |
|---|---|---|
| Custom API server | **Hono** | TypeScript-native, ultra-lightweight, runs on Bun/Node. Sits in front of Postgres |
| Runtime | **Bun** (preferred) or **Node 22+** | Fast startup, native TypeScript |
| Containerization | **Docker Compose** on EC2/Oracle VM | Postgres + Hono API + Nginx reverse proxy |
| Process manager | **PM2** or `docker compose restart: always` | |
| Reverse proxy | **Nginx** | TLS termination, routes `/api/*` → Hono, serves nothing else |

> **Migration principle:** In Phase A, all server logic is in `/src/lib/api/` modules called by Server Actions. In Phase B, those same modules become Hono route handlers. The business logic doesn't move — only the entry point does.

---

## Database

| Concern | Phase A | Phase B |
|---|---|---|
| Database | **Supabase Postgres** (managed) | **Self-hosted Postgres 16** on VM (Docker) |
| Auth | **Supabase Auth** (managed) | **Custom auth** (JWT, bcrypt) via Hono — or keep GoTrue self-hosted |
| Row-Level Security | **Supabase RLS** (PostgRES engine) | RLS stays — same policies work on self-hosted Postgres |
| ORM / query layer | **Drizzle ORM** | Same Drizzle schema/queries work against both Supabase and raw Postgres |
| Migrations | **Drizzle Kit** | Same tooling, different connection string |
| Storage | **Supabase Storage** | S3-compatible (AWS S3 or self-hosted MinIO on VM) |
| Realtime | **Supabase Realtime** | Postgres LISTEN/NOTIFY or lightweight WS via Hono in Phase B |

### Schema (entities)
`tenants`, `users`, `members`, `membership_plans`, `memberships`, `payments`, `attendance`

### RLS Hard Rule
> Platform role has **zero** RLS path to `members`, `payments`, `attendance`, `memberships`, `membership_plans`. Enforced at the DB layer — not UI.

---

## Auth & Roles

| Tier | Role | Scope |
|---|---|---|
| Platform | `platform` | CRUD on `tenants` only |
| Admin | `admin` | Full CRUD within own tenant |
| Staff | `staff` | Member CRUD, check-in, manual payments; no plan/pricing edits |
| Members | — | No login in MVP. Records, not accounts |

- **Phase A:** Supabase Auth. JWT custom claims inject `role` + `tenant_id` via Auth Hook (Postgres function).
- **Phase B:** GoTrue self-hosted **or** custom JWT via Hono. Same claim structure (`role`, `tenant_id`) so the frontend doesn't change.

---

## Payments

| Concern | Choice | Notes |
|---|---|---|
| Payment gateway | **Abstracted** behind a `PaymentProvider` interface | Razorpay likely first implementation; swappable |
| Webhook handling | Next.js API Route (Phase A) → Hono route (Phase B) | Signature verification is per-provider, inside the implementation |
| Payment records | Stored in `payments` table by the webhook handler | |
| Subscription billing | Modelled in `memberships` table; provider handles recurring | |

> `PaymentProvider` interface: `createOrder()`, `verifyWebhook()`, `refund()`. First impl: Razorpay.

---

## Notifications

| Concern | Choice | Notes |
|---|---|---|
| Member notifications | **WhatsApp Business API** | High open rates in Indian gym market |
| Provider | **Twilio / Gupshup / Wati** (TBD at integration time) | Abstracted behind a `NotificationProvider` interface |
| Triggers | Membership expiry reminders, payment confirmations | Cron via Supabase Scheduled Functions (Phase A) or Hono cron (Phase B) |
| Internal alerts | In-app toast / dashboard badges | No external channel |

---

## Pricing Model

| Component | Detail |
|---|---|
| Model | **One-time license fee** + **per-active-member monthly/annual fee** |
| Platform panel | Tracks `tenants.status` (trial / active / suspended) and active member count |
| License tracking | Stored in `tenants` table with a `license_expires_at` / `active_members_count` field |

---

## Testing

| Type | Tooling |
|---|---|
| Unit + component | **Vitest** + **React Testing Library** |
| E2E | **Playwright** |
| Priority E2E flows | Login → role redirect, QR check-in scan, payment webhook, logout cache clear |
| Type safety | TypeScript strict mode + Zod at all API boundaries |

---

## Monitoring & Observability

| Concern | Choice |
|---|---|
| Error tracking | **Sentry** (Next.js SDK) |
| Performance | Vercel Analytics + Lighthouse CI |
| Logs (Phase B) | Docker logs → optional Loki/Grafana or Datadog |

---

## CI/CD

| Concern | Choice |
|---|---|
| Version control | Git (GitHub) |
| Frontend deploys | **Vercel** (auto-deploy on push to `main`) |
| Backend deploys (Phase B) | GitHub Actions → SSH → `docker compose pull && up -d` on VM |
| DB migrations | Drizzle Kit migrations run in CI before app deploy |
| Secrets | Vercel env vars (Phase A); VM `.env` + GitHub Actions Secrets (Phase B) |

---

## Phase A → Phase B Migration Checklist

- [ ] Swap Supabase Postgres DSN → self-hosted Postgres DSN in Drizzle config
- [ ] Swap Supabase Auth → GoTrue/custom JWT (same claim structure)
- [ ] Swap Supabase Storage → S3/MinIO endpoint
- [ ] Extract Server Actions business logic → Hono route handlers
- [ ] Set up Nginx + Docker Compose on VM
- [ ] Re-point webhook URLs to VM endpoint
- [ ] Replace Supabase Realtime → Postgres LISTEN/NOTIFY or WS

> Each swap is isolated. No step requires touching another step's code.
