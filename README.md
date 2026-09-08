# GymERP — Multi-Tenant Gym Management Platform

> High-performance, multi-tenant ERP platform designed for independent gyms, martial arts dojos, and fitness studios. Built with strict data isolation, offline-ready check-in kiosks, and role-scoped operational dashboards.

[![Stack: Next.js 14+](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![Database: PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![ORM: Drizzle](https://img.shields.io/badge/ORM-Drizzle-C5F74F.svg)](https://orm.drizzle.team/)
[![Auth: Firebase](https://img.shields.io/badge/Auth-Firebase-FFCA28.svg)](https://firebase.google.com/)
[![CSS: Tailwind v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4.svg)](https://tailwindcss.com/)
[![UI: shadcn/ui](https://img.shields.io/badge/UI-shadcn%2Fui-000000.svg)](https://ui.shadcn.com/)

---

## System Architecture

```mermaid
flowchart TB
    subgraph Clients["Clients & Edge Tier"]
        PWA["Front-Desk Kiosk / Mobile PWA\n(Serwist + Offline IndexedDB)"]
        Browser["Admin / Staff / Platform Browser\n(Next.js RSC + TanStack)"]
    end

    subgraph AppTier["Application Tier (Next.js 14+)"]
        MW["Auth Middleware\n(Session Cookie Check)"]
        RSC["Server Components\n(Tenant-Scoped Drizzle Query)"]
        SA["Server Actions & Route Handlers\n(Mutations & Webhooks)"]
        FAdmin["Firebase Admin SDK\n(Token Verification & Claims)"]
    end

    subgraph AuthTier["Identity Tier"]
        FAuth["Firebase Auth\n(Custom Claims: role, tenant_id)"]
    end

    subgraph StorageTier["Data & Storage Tier"]
        PG[("PostgreSQL 16\n(Docker / Dedicated VPS)")]
        RLS["PostgreSQL RLS\n(SET LOCAL app.current_tenant_id)"]
        FStore["Firebase Storage\n(Avatars & Gym Logos)"]
    end

    Browser --> MW
    PWA --> MW
    MW --> RSC
    MW --> SA
    SA <--> FAdmin
    FAdmin <--> FAuth
    RSC --> RLS --> PG
    SA --> RLS --> PG
    SA --> FStore
```

---

## 4-Tier Security & Role Hierarchy

Multi-tenancy is enforced with **defense-in-depth**:
1. **Application Layer**: All Drizzle ORM queries are wrapped in tenant repository scopes (`where: eq(table.tenantId, tenantId)`).
2. **Database Layer (RLS)**: PostgreSQL Row-Level Security policies evaluate `tenant_id = current_setting('app.current_tenant_id', true)::uuid`.
3. **Identity Layer**: Firebase Auth JWT custom claims strictly isolate user roles.

| Role | Scope | Database Access | Key Capabilities |
|---|---|---|---|
| **Platform Superadmin** (`platform`) | Global | `tenants` table **only**. Zero RLS grant to tenant data. | Provision gyms, toggle tenant lifecycle (`trial`, `active`, `suspended`), inspect system ARR and DB metrics. Cannot inspect members, payments, or attendance. |
| **Gym Admin** (`admin`) | Single Tenant | Full CRUD within assigned `tenant_id`. | Configure membership plans, manage staff accounts, view financial metrics, export rosters. |
| **Front-Desk Staff** (`staff`) | Single Tenant | Read/write members, check-ins, manual payments. No plan/pricing edits. | Search members, register new attendees, operate self-service QR check-in kiosk with camera scanner. |
| **Gym Member** (End User) | Unauthenticated MVP | Member records in DB with unique `qr_token`. (Portal planned for post-MVP). | Check in via physical barcode/QR token at desk or kiosk scanner. |

---

## Repository Structure

```
gymerp/
├── docker-compose.yml              # Local PostgreSQL 16 container with healthcheck
├── .env.example                    # Environment variable template
├── SETUP.md                        # Developer 5-minute quickstart guide
├── README.md                       # Project architecture and reference manual
│
├── docs/                           # Architecture, specs, and design system
│   ├── PRD.md                      # Product Requirements Document
│   ├── tech-stack.md               # Technical choices & migration principles
│   ├── setup-guide.md              # Exhaustive setup & runbook guide
│   ├── design-system.md            # Visual language, tokens, and dark aesthetic
│   │
│   ├── phase-0-foundation-schema.md       # Drizzle Schema + Postgres RLS + Firebase Setup
│   ├── phase-1-web-auth-dashboard-shell.md# Session cookies, route guards, UI layout
│   ├── phase-2-platform-tenant-management.md # Superadmin portal & tenant lifecycle
│   ├── phase-3-web-members-memberships.md # Member directory, plans, and profiles
│   ├── phase-4-web-payments-attendance.md # Razorpay webhooks, kiosk, offline sync
│   ├── phase-5-pwa-performance-hardening.md # Serwist PWA, security audits, prod checklist
│   │
│   ├── wireframes/                 # ASCII UI wireframes for all views
│   └── demo/                       # Interactive HTML/JS/CSS prototypes
│       ├── index.html              # Demo Hub & quick role launcher
│       ├── 01-login.html           # Auth portal & credentials switcher
│       ├── 02-platform.html        # Platform Superadmin multi-tenant console
│       ├── 03-admin.html           # Gym Admin operational dashboard
│       └── 04-staff.html           # Staff terminal & laser-scan kiosk
│
├── src/ (Target implementation)
│   ├── app/                        # Next.js 14 App Router routes
│   │   ├── (auth)/                 # Login and password recovery
│   │   ├── (platform)/             # Platform superadmin routes
│   │   ├── (admin)/                # Gym admin dashboard routes
│   │   ├── (staff)/                # Front-desk and kiosk routes
│   │   └── api/                    # Auth session exchange & webhooks
│   ├── components/                 # shadcn/ui and custom design system primitives
│   ├── lib/
│   │   ├── api/                    # Modular business logic services
│   │   ├── db/                     # Drizzle schema, client, and tenant wrapper
│   │   └── firebase/               # Firebase Client & Admin SDK singletons
│   └── types/                      # Shared TypeScript models and claims
```

---

## Quick Navigation

- **Fast Onboarding**: Follow [SETUP.md](file:///home/rev/Documents/projects/gymerp/SETUP.md) for 5-minute setup.
- **Deep Setup Manual**: Read [docs/setup-guide.md](file:///home/rev/Documents/projects/gymerp/docs/setup-guide.md).
- **Interactive Demos**: Launch [`docs/demo/index.html`](file:///home/rev/Documents/projects/gymerp/docs/demo/index.html) in your browser.
- **Implementation Specs**:
  - [Phase 0 — Database Schema, RLS & Firebase Auth](file:///home/rev/Documents/projects/gymerp/docs/phase-0-foundation-schema.md)
  - [Phase 1 — Auth Flow, Session Cookies & Shell](file:///home/rev/Documents/projects/gymerp/docs/phase-1-web-auth-dashboard-shell.md)
  - [Phase 2 — Platform Superadmin & Tenant Management](file:///home/rev/Documents/projects/gymerp/docs/phase-2-platform-tenant-management.md)
  - [Phase 3 — Members & Memberships](file:///home/rev/Documents/projects/gymerp/docs/phase-3-web-members-memberships.md)
  - [Phase 4 — Payments, Webhooks & Attendance Kiosk](file:///home/rev/Documents/projects/gymerp/docs/phase-4-web-payments-attendance.md)
  - [Phase 5 — PWA, Performance & Production Hardening](file:///home/rev/Documents/projects/gymerp/docs/phase-5-pwa-performance-hardening.md)

---

## License
Proprietary & Confidential. All rights reserved.
