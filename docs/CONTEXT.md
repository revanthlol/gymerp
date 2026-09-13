# GymERP — Project Context & Architecture Status

> **CRITICAL DIRECTIVE FOR AI ASSISTANTS (CLAUDE / CODEX / CHATGPT):**
> **DO NOT ASSUME THIS PROJECT IS IN "PHASE 2".**
> The markdown files located in `docs/phases/` are **historical planning specifications**.
> **ALL PHASES (Phase 0 through Phase 5) AND EXTENSIONS ARE 100% COMPLETE, INTEGRATED, AND DEPLOYED TO PRODUCTION.**
> Always review this document and inspect existing code in `src/` before proposing architecture or claiming a feature is missing.

---

## 1. Project Overview & Current State

GymERP is a full-stack, multi-tenant enterprise resource planning (ERP) platform built for gyms, fitness centers, and combat sport academies. It features dedicated role portals, a hardware check-in kiosk with rotating QR codes, member self-service PWA passes, financial management, class scheduling, and an isolated platform superadmin fleet control center.

### Production Deployments

| Component | Provider / Host | Public Endpoint | Status |
|---|---|---|---|
| **Frontend Web App** | Vercel (Edge/Serverless) | [https://gymerp-liard.vercel.app](https://gymerp-liard.vercel.app) | **Live (200 OK)** |
| **Backend REST API** | Oracle Cloud VM (Ubuntu, PM2 `gymerp-api`) | [https://gymerp.duckdns.org](https://gymerp.duckdns.org) | **Online (Healthy)** |
| **Database** | Neon Serverless PostgreSQL | Pooled & Direct Connections | **Live & Clean (Zero dummy data)** |
| **Authentication** | Firebase Auth + Firebase Admin SDK | Custom Claims (`platform`, `admin`, `staff`, `member`) | **Active** |
| **DNS / Dynamic IP** | DuckDNS | `gymerp.duckdns.org` -> `140.245.218.2` | **Active** |

---

## 2. Phase Execution Status

| Phase | Milestone Name | Status | Key Implemented Features |
|---|---|---|---|
| **Phase 0** | Foundation & Schema | **Complete** | Neon PostgreSQL, Drizzle ORM, multi-tenant RLS schema, Firebase Admin SDK setup. |
| **Phase 1** | Web Auth & Dashboard Shell | **Complete** | Role-based routing, session cookies, dynamic navigation, responsive mobile drawers. |
| **Phase 2** | Platform Superadmin Management | **Complete** | Tenant provisioning, status lifecycle (`active`/`suspended`/`trial`), license management. |
| **Phase 3** | Members & Membership Plans | **Complete** | Membership plans CRUD, member dossiers, automated QR token generation, status filters. |
| **Phase 4** | Payments, Webhooks & Kiosk | **Complete** | Razorpay integration, cash payment entry, hardware kiosk check-in, duplicate prevention. |
| **Phase 5** | Hardening, PWA & Security | **Complete** | PWA manifests, zero-leak session clearing, CSP headers, rate-limiting, error boundaries. |
| **Extension 1** | Standalone Fastify Backend API | **Complete** | Deployed on Oracle Cloud VM under PM2, live at `https://gymerp.duckdns.org`. |
| **Extension 2** | Member Self-Service Portal | **Complete** | `/portal/*` (athlete login, digital QR pass, attendance history, profile). |
| **Extension 3** | Dual-Mode Tablet Hardware Kiosk | **Complete** | Dynamic rotating QR scan + on-screen tactile keypad for dead phone batteries. |
| **Extension 4** | Superadmin Fleet Command | **Complete** | License extensions (+30d, +90d, +1yr, Lifetime), credential resets, cascading tenant purge. |
| **Extension 5** | Landing Page Framer Motion Overhaul | **Complete** | Vibrant aurora background, kiosk simulator, WCAG AAA accessibility, no AI-style pills. |
| **Extension 6** | Discreet Platform Console Access | **Complete** | Hidden from public view; accessible via direct URL, `Ctrl+Shift+P`, or 5-click footer easter egg. |

---

## 3. Tech Stack & Architecture

### Frontend (Next.js 14 App Router)
- **Framework**: Next.js 14.2 (App Router, Server Components + Server Actions)
- **Styling**: Tailwind CSS v3, Tailwind Animate, Lucide React icons
- **Animations**: Framer Motion (floating gradients, interactive simulator, reveal transitions)
- **Forms & Validation**: React Hook Form, Zod schemas (`src/lib/validations/*`)
- **State Management**: Server-side fetching, lightweight client hooks

### Backend & API
1. **Next.js Server Actions & Route Handlers**: Primary data mutations, session authentication, webhooks (`/api/auth/*`, `/api/webhooks/*`).
2. **Fastify Standalone API Server (`src/server/index.ts`)**:
   - Running in production on Oracle Cloud VM under PM2 (`gymerp-api`).
   - CORS-configured, helmet security headers, JWT verification.
   - Routes: `/tenants`, `/auth`, `/members`, `/classes`, `/payments`, `/attendance`, `/dashboard`, `/health`.

### Database & Security (Neon PostgreSQL + Drizzle ORM)
- **Connection**: Neon serverless connection pool (`@neondatabase/serverless`).
- **ORM**: Drizzle ORM with TypeScript schemas (`src/lib/db/schema.ts`).
- **Multitenancy**: Enforced via `withTenantDb` context helper in `src/lib/db/tenant-context.ts`.
  - Every tenant-scoped query automatically asserts and filters by `tenant_id`.
  - Platform superadmins have explicit isolation guards preventing unauthorized access to member PII.

---

## 4. Role & Portal Matrix

```
                          ┌────────────────────────┐
                          │   gym.erp Landing (/)  │
                          └───────────┬────────────┘
                                      │
         ┌────────────────────────────┼───────────────────────────┐
         ▼                            ▼                           ▼
┌──────────────────┐        ┌──────────────────┐        ┌───────────────────┐
│   Athlete Pass   │        │ Front Desk / Gym │        │  Platform Super-  │
│  (/portal/login) │        │  Admin (/login)  │        │ admin (/platform) │
└────────┬─────────┘        └─────────┬────────┘        └─────────┬─────────┘
         │                            │                           │ (Hidden: Ctrl+Shift+P
         ▼                            ▼                           │  or 5x footer click)
 ┌───────────────┐           ┌─────────────────┐                  ▼
 │ Member Portal │           │  Role Dispatch  │          ┌───────────────┐
 │   (/portal)   │           └────────┬────────┘          │ Fleet Command │
 └───────────────┘                    │                   │  (/platform)  │
                        ┌─────────────┴─────────────┐     └───────────────┘
                        ▼                           ▼
              ┌──────────────────┐        ┌──────────────────┐
              │    Gym Admin     │        │ Front-Desk Staff │
              │    (/admin/*)    │        │    (/staff/*)    │
              └──────────────────┘        └──────────────────┘
```

### 1. Platform Superadmin (`/platform`)
- **Access**: Hidden from public view. Accessible via `/platform/login`, keyboard shortcut `Ctrl+Shift+P` / `Cmd+Shift+P`, or clicking the "G" footer logo 5 times.
- **Role Claim**: `role: "platform"`
- **Capabilities**:
  - Fleet Overview: Total gyms, ARR metrics, network athletes, total check-ins.
  - Tenant Lifecycle: Create new gym, toggle `active` / `suspended` / `trial`.
  - License Extensions: 1-click extension buttons (+30 days, +90 days, +1 year, Lifetime).
  - Admin Credential Resets: Generate secure one-time credentials with 1-click copy cards and password reset links.
  - Cascading Tenant Purge: Permanently wipe tenant and all associated records (attendance, payments, memberships, classes, plans, members, users) plus Firebase Auth cleanup.

### 2. Gym Admin (`/admin/*`)
- **Access**: Authenticated via `/login` with `role: "admin"`.
- **Capabilities**:
  - `/admin`: Dashboard with live KPIs (revenue, active members, attendance breakdown, recent alerts).
  - `/admin/analytics`: Visual charts, retention metrics, member acquisition trends.
  - `/admin/members`: Full member CRUD, filter by status (`active`, `expired`, `frozen`), QR pass generator.
  - `/admin/plans`: Create and manage membership tiers, pricing, duration, features.
  - `/admin/payments`: Record cash/card payments, view online Razorpay settlement statuses.
  - `/admin/attendance`: Attendance records table, date filtering, manual attendance logging.
  - `/admin/classes`: Schedule classes, set participant limits, assign trainers/coaches.
  - `/admin/kiosk`: Fullscreen front-desk kiosk display mode with dynamic QR codes.
  - `/admin/onboarding`: Initial setup wizard for gym profile, logo, business hours, and starter plans.

### 3. Front-Desk Staff (`/staff/*`)
- **Access**: Authenticated via `/login` with `role: "staff"`.
- **Capabilities**:
  - `/staff`: Daily front-desk dashboard (today's arrivals, pending fees, upcoming classes).
  - `/staff/members`: Athlete roster search, member creation, photo/membership verification (cannot delete gym data).
  - `/staff/attendance`: Check-in scanner, attendance log, manual check-in override.
  - `/staff/classes`: Today's class roster, attendee check-in.
  - `/staff/kiosk`: Tablet kiosk mode for unattended front-desk check-ins.

### 4. Member / Athlete Portal (`/portal/*`)
- **Access**: Authenticated via `/portal/login` with member credentials or phone number.
- **Capabilities**:
  - `/portal`: Digital membership card, active plan details, validity expiry date, check-in history.
  - `/portal/scan`: Mobile camera scanner allowing members to scan gym kiosk displays.

---

## 5. Hardware Kiosk & Attendance Architecture

The kiosk check-in flow supports both attended and unattended gym entrance terminals:

1. **Dynamic Rolling QR Code Mode**:
   - The kiosk displays an encrypted token that auto-refreshes every 15-30 seconds.
   - Members scan the kiosk screen using their phone camera (`/portal/scan`).
   - The server validates the cryptographic timestamp, verifies active membership, records attendance, and emits real-time visual and audio feedback.

2. **Tactile Keypad Backup Mode (Dead Phone Solution)**:
   - When a member's phone battery is dead, they toggle to the on-screen keypad.
   - They enter their 4-digit PIN / Member Code.
   - The system verifies the athlete instantly and checks them in.

3. **Duplication Guard**:
   - Attendance check-ins are rate-limited to prevent double entries within 12 hours unless an explicit "check-out" mode is toggled.

---

## 6. Project Directory Structure

```
gymerp/
├── docs/                      # Planning specifications (Phases 0-5, PRD, guides)
├── drizzle/                   # Drizzle SQL migration files
├── public/                    # Static assets, audio chimes, icons, manifest
├── scripts/                   # Database maintenance scripts (wipe dummy data, verify tables)
├── src/
│   ├── app/                   # Next.js 14 App Router
│   │   ├── (auth)/login       # Staff & Gym Admin login
│   │   ├── (dashboard)/admin  # Full Gym Admin suite (dashboard, members, plans, payments, etc.)
│   │   ├── (dashboard)/staff  # Front-desk staff suite
│   │   ├── (platform)         # Discreet platform superadmin console & login
│   │   ├── (portal)           # Member self-service portal & mobile scanner
│   │   └── api/               # Auth, health, and webhook route handlers
│   ├── components/            # UI components (shadcn primitives, modals, forms)
│   │   ├── landing/           # Framer motion animated landing page & kiosk simulator
│   │   ├── platform/          # Fleet management tables, dialogs, telemetry cards
│   │   └── ...
│   ├── hooks/                 # Reusable client hooks (auth, audio feedback, kiosk state)
│   ├── lib/
│   │   ├── api/               # Next.js Server Actions (tenants, members, plans, payments)
│   │   ├── auth/              # Firebase client & admin session management, cookies
│   │   ├── db/                # Drizzle schema, Neon connection pool, withTenantDb
│   │   └── validations/       # Zod schemas for all forms & server actions
│   ├── server/                # Standalone Fastify API server (deployed to Oracle VM)
│   │   ├── routes/            # Fastify REST endpoints (tenants, auth, members, etc.)
│   │   └── index.ts           # Fastify server entry point
│   └── middleware.ts          # Edge routing middleware enforcing role-gated routes
├── .env.example               # Environment variable templates
├── drizzle.config.ts          # Drizzle ORM configuration
├── package.json               # Dependencies & build scripts
└── vercel.json                # Vercel deployment configuration
```

---

## 7. Operational Runbook & Developer Commands

### Local Development
```bash
# Install dependencies
pnpm install

# Start Next.js development server
pnpm dev

# Run TypeScript typecheck (strict mode)
pnpm run typecheck

# Build for production
pnpm build
```

### Standalone Backend Server (Oracle Cloud VM)
```bash
# Connect to Oracle server
ssh backend

# Backend directory
cd /home/ubuntu/gymerp

# Git pull & restart PM2 service
git pull && pm2 restart gymerp-api && pm2 status

# Check logs
pm2 logs gymerp-api --lines 50

# Test backend health
curl -s https://gymerp.duckdns.org/health
```

### Frontend Deployment (Vercel)
```bash
# Deploy directly to Vercel production
npx vercel --prod --yes
```

### Database Operations (Neon PostgreSQL)
```bash
# Push schema updates with Drizzle
pnpm drizzle-kit push:pg

# Open Drizzle Studio
pnpm drizzle-kit studio
```

---

## 8. Summary for AI Assistants
When continuing work or discussing GymERP:
- **Do NOT** offer to implement Phase 2 or Phase 3 from scratch; they are already running in production.
- **Do NOT** add mock or placeholder data; the system has been wiped clean for live manual testing.
- Treat the code in `src/` as the single source of truth over markdown proposals in `docs/`.
