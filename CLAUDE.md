# CLAUDE.md — GymERP Developer & Context Guide

> **CRITICAL ARCHITECTURAL DIRECTIVE:**
> **DO NOT ASSUME THIS PROJECT IS IN "PHASE 2".**
> The files under `docs/phase-*.md` are historical planning specs.
> **ALL PHASES (0 to 5) AND EXTENSIONS ARE 100% COMPLETE AND DEPLOYED IN PRODUCTION.**
> Detailed system status, route matrix, and database design are documented in [CONTEXT.md](./CONTEXT.md).

---

## Key System Facts

- **Frontend**: Next.js 14.2 App Router on Vercel: `https://gymerp-liard.vercel.app`
- **Backend API**: Fastify standalone TypeScript server on Oracle Cloud VM: `https://gymerp.duckdns.org` (PM2 process `gymerp-api` on port 4000, mapped via DuckDNS to `140.245.218.2`)
- **Database**: Neon Serverless PostgreSQL with Drizzle ORM (`src/lib/db/schema.ts`).
  - **Zero Dummy Data**: Database was completely purged of mock/seed rows for clean live testing.
- **Authentication**: Firebase Auth + Firebase Admin SDK session cookies with custom claims (`platform`, `admin`, `staff`, `member`).

---

## Role & Portal Routing

1. **Platform Superadmin (`/platform`)**:
   - **Hidden from public UI**: No navbar/footer links.
   - Access: `/platform/login`, shortcut `Ctrl+Shift+P` / `Cmd+Shift+P`, or 5 clicks on footer "G" logo.
   - Controls: Tenant lifecycle (`active`, `suspended`, `trial`), license extension dialog (+30d, +90d, +1yr, lifetime), admin password reset (with 1-click copy cards), cascading tenant purge.
2. **Gym Admin (`/admin/*`)**:
   - Routes: `/admin` (KPIs), `/admin/analytics`, `/admin/members`, `/admin/plans`, `/admin/payments`, `/admin/attendance`, `/admin/classes`, `/admin/kiosk`, `/admin/onboarding`.
3. **Front-Desk Staff (`/staff/*`)**:
   - Routes: `/staff` (Desk dashboard), `/staff/members`, `/staff/attendance`, `/staff/classes`, `/staff/kiosk`.
4. **Athlete / Member Pass (`/portal/*`)**:
   - Routes: `/portal/login`, `/portal` (digital membership card, plan expiry, attendance logs), `/portal/scan` (camera scanner for kiosk check-in).
5. **Public Landing Page (`/`)**:
   - Vibrant Framer Motion animations with floating aurora glow.
   - Dual-mode interactive kiosk simulator (Dynamic QR sweep + tactile PIN keypad backup).
   - Zero generic AI-style glowing pills. Fully WCAG AAA accessible.

---

## Developer Runbook

```bash
# Typecheck & Build
pnpm run typecheck
pnpm build

# Update Remote Backend (Oracle VM)
ssh backend "cd /home/ubuntu/gymerp && git pull && pm2 restart gymerp-api && pm2 status"
curl -s https://gymerp.duckdns.org/health

# Deploy Frontend (Vercel)
npx vercel --prod --yes
```

For full context, data models, and sequence diagrams, refer to [CONTEXT.md](./CONTEXT.md).
