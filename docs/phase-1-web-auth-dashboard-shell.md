# Phase 1 — Web: Dashboard Shell + Auth + PWA Scaffold

## Goals
- Next.js (App Router) app, shadcn/ui installed via CLI, primitives added incrementally — no forked starter
- Supabase Auth wired (email/password to start)
- Role-gated route groups: `/platform`, `/admin`, `/staff`
- Reusable `<DataTable>` and form pattern (built once here, reused every later phase)
- **PWA scaffold set up now, not bolted on later** — manifest + service worker for app-shell caching only

## Tasks
1. `npx shadcn@latest init`, add components as screens need them
2. Supabase Auth — login page, session handling, JWT claim reading (`role`, `tenant_id`) into a React context
3. Route groups: `app/(platform)/...`, `app/(admin)/...`, `app/(staff)/...` with a layout-level role check that redirects unauthorized roles out
4. Build one reusable `<DataTable>` (`@tanstack/react-table` + shadcn `<Table>`) — sortable, filterable, paginated
5. Build one reusable form pattern (shadcn `<Form>` + `react-hook-form` + Zod)
6. Platform-tier home page: empty tenants table wired to real Supabase data (first end-to-end proof of the stack)
7. **PWA setup:** install `@serwist/next`, add `manifest.json` (name, icons, `display: "standalone"`, theme color), configure the service worker to cache **static assets only** (JS/CSS/fonts/icons) — explicitly exclude any Supabase/API routes from the SW cache. Verify installability via Chrome DevTools' Lighthouse PWA audit.

## Exit criteria
- [ ] Platform, admin, and staff test accounts log in and land in their correct route group
- [ ] An admin/staff account attempting to hit `/platform/*` is redirected, not just hidden via nav
- [ ] `<DataTable>` and form pattern both proven working against a real Supabase table (`tenants`)
- [ ] A `platform` session's raw API call to `members` fails (first live proof Phase 0's RLS holds at the app layer)
- [ ] App installs as a PWA (Lighthouse PWA check passes), and confirm via DevTools Application tab that no API responses are sitting in the SW cache
