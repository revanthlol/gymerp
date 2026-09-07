# Gym ERP — Product Requirements Document (v0.3 — Website-only + PWA)

## 1. Overview
A multi-tenant SaaS ERP for gym owners/managers, delivered as a **website only**, built as an installable, fast, offline-tolerant **PWA**. Handles members, memberships, payments, and attendance. Sold as a one-time license to gym owners (final pricing structure still open — see §8).

## 2. Role Tiers (4 tiers)
| Tier | Who | Scope |
|---|---|---|
| **Platform** | Rev's team (you) | Manages gym `tenants` — create/suspend accounts, licensing/billing status. **No access to member-level data** — enforced at the DB level. |
| **Admin** | Gym owner/manager (customer) | Full control within their tenant: members, plans, pricing, payments, staff accounts, reports |
| **Staff** | Front-desk / gym employees | Member CRUD, check-in, manual payment entry — no plan/pricing edit rights |
| **Members** | Gym members | Not directly controlled by Platform, no login in MVP — managed entirely through Admin/Staff |

## 3. MVP Scope (Core Ops)
- **Platform panel** — tenant creation, activation/suspension, license/billing status
- **Member management** — CRUD, status (active/expired/frozen)
- **Membership plans** — Admin-defined plans, assigned to members
- **Payments** — Razorpay online checkout + subscriptions, manual/cash entry with staff override
- **Attendance** — browser-based QR check-in (device camera, no native app)
- **Auth & roles** — platform/admin/staff via Supabase Auth + RLS

**Explicitly out of scope for MVP:** mobile app, member self-service login/portal, trainer/class scheduling, inventory, payroll, marketing/CRM, multi-location per tenant.

## 4. Architecture Summary
- **Website:** Single Next.js (App Router) app, role-gated route groups: `/platform`, `/admin`, `/staff`
- **UI:** Raw shadcn/ui primitives + Tailwind, built from scratch for full customization control
- **Backend:** Supabase (Postgres, Auth, Storage, Realtime, Row-Level Security)
- **Payments:** Razorpay (Checkout + Subscriptions API, webhook-driven)
- **PWA:** Serwist (modern, App-Router-native successor to Workbox/next-pwa) for service worker + manifest
- **Deployment model:** Multi-tenant SaaS — shared Postgres tables scoped by `tenant_id`, RLS enforces isolation between tenants AND between Platform and member-level data

## 5. Data Model (high-level)
`tenants` (+status), `users` (role: platform/admin/staff), `members`, `membership_plans`, `memberships`, `payments`, `attendance`. RLS: tenant-scoped tables filter by `tenant_id`; no policy anywhere grants `platform` access to member-level tables.

## 6. Roles & Permissions
- **Platform:** CRUD on `tenants` only. No RLS path to member-level tables exists.
- **Admin:** full CRUD within own tenant
- **Staff:** member CRUD, check-in scanning, manual payments — no pricing edit
- Members have no login/role in MVP

## 7. PWA & Performance Requirements
- **Installable** — manifest.json, standalone display, icons — most useful on the `/staff/checkin` kiosk screen, which front desks may run on a dedicated tablet
- **Fast** — target Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1. Use React Server Components for data-heavy dashboard pages (tables render server-side, ship less client JS), `next/image` for any images, Suspense streaming for perceived speed on slower connections
- **Offline tolerance, scoped correctly** — service worker caches the **app shell only** (static JS/CSS/fonts/icons). It must **never** cache authenticated API/Supabase responses — a shared kiosk device switching between tenant sessions is a real data-leak vector if that rule is violated. Auth state and all member/tenant data always goes over the network, never through the SW cache.
- **Cache hygiene** — clear all caches (and any client-side storage) on logout, not just on session-token expiry, since kiosk devices may be shared by staff shift-to-shift

## 8. Non-Functional Notes / Known Trade-offs
- Multi-tenant SaaS vs. "one-time payment" still needs a pricing decision (one-time + hosting fee / tiered bands / accepted ongoing cost)
- Raw shadcn/ui build is slower to first-render than forking a starter, in exchange for full customization control — accepted trade-off
- Platform/member data separation is a hard architectural rule: every new table needs an explicit decision on Platform access, default is **no**

## 9. Open Questions
- Final one-time-price structure
- Whether member self-service ever returns to the roadmap
- Renewal reminder channel (SMS/WhatsApp/push) — no member-facing channel currently exists
