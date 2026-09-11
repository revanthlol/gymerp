# GymERP Dedicated Node.js (Fastify) API Server Guide

## Why a Dedicated Node.js Server?

Serverless edge functions suffer from:
1. **Cold Starts**: 1–3s latency spikes on infrequent requests.
2. **Connection Thrashing**: Spawning new PostgreSQL connections per invocation exhausts database limits.
3. **Turnstile Lag**: Turnstiles and optical scanners need **sub-50ms** barcode validation.

GymERP includes a persistent **Fastify 4.x** server located in [`src/server/index.ts`](../src/server/index.ts) with:
- Pre-warmed persistent connection pooling to PostgreSQL.
- Sub-50ms attendance scanning and verification.
- Full CORS & cookie credential handling.
- Real-time attendance streams and health telemetry.

---

## 1. Quick Start (Development)

Run both the Next.js frontend (port `3000`) and the Fastify API (port `4000`) concurrently:

```bash
pnpm dev
```

Next.js automatically proxies `/api/v1/*`, `/api/node/*`, and `/node-health` to `http://localhost:4000` via rewrites configured in `next.config.mjs`.

### Run Services Individually

| Command | Purpose | Port |
| :--- | :--- | :--- |
| `pnpm dev` | Next.js Frontend + Fastify API concurrently | `3000` & `4000` |
| `pnpm dev:api` | Fastify API only with hot reloading (`tsx watch`) | `4000` |
| `pnpm dev:next` | Next.js Frontend only | `3000` |

---

## 2. Environment Variables

Create or ensure your `.env.local` contains:

```env
# Server Port & Host
PORT=4000
HOST=0.0.0.0
APP_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@neon-host/gymerp?sslmode=require"

# Auth & Security
COOKIE_SECRET="super-secret-key-for-cookie-signing-min-32-chars"
SESSION_COOKIE_NAME="__session"
SESSION_COOKIE_EXPIRES_IN=432000

# Frontend Next.js Proxy Target (for Next.js server/client)
API_SERVER_URL="http://localhost:4000"
```

---

## 3. Verifying Health & Latency

When the API server is running, check status and database connection latency:

```bash
curl http://localhost:4000/health
```

Expected output:
```json
{
  "status": "healthy",
  "uptimeSeconds": 14,
  "timestamp": "2026-09-11T12:26:44.464Z",
  "database": {
    "status": "connected",
    "pingLatencyMs": 55,
    "totalConnections": 1,
    "idleConnections": 1,
    "waitingConnections": 0
  },
  "memoryUsageMb": {
    "rss": 157,
    "heapUsed": 32
  }
}
```

---

## 4. Production Deployment

### Option A: Docker Compose (Recommended for VPS / VM)

Run both Next.js and the Node API via Docker:

```bash
docker compose up -d --build
```

- Frontend: `http://<your-ip>:3000`
- Fastify API: `http://<your-ip>:4000`

### Option B: PM2 on Ubuntu / Debian VPS

```bash
# 1. Install PM2 globally
npm install -g pm2

# 2. Start API Server with auto-restart
pm2 start "npx tsx src/server/index.ts" --name "gymerp-api"

# 3. Save PM2 configuration to launch on reboot
pm2 save
pm2 startup
```

### Option C: Railway / Render / DigitalOcean App Platform

Deploy [`src/server/index.ts`](../src/server/index.ts) as a standalone Node.js service:
- **Build Command**: `pnpm install`
- **Start Command**: `npx tsx src/server/index.ts`
- **Port**: `4000` (or leave as `$PORT` dynamically assigned by the platform)
- **Frontend setting**: On Vercel / frontend host, set `API_SERVER_URL=https://your-api-domain.com`.

---

## 5. API Route Directory

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/health` | `GET` | Postgres pool metrics, heap usage & ping latency |
| `/api/attendance/scan` | `POST` | Sub-50ms turnstile QR barcode validation |
| `/api/attendance/stream` | `GET` | Live stream of member gym entrances |
| `/api/members` | `GET`, `POST` | Athlete list and new registration |
| `/api/members/:id/notes` | `PATCH` | Update coach notes on athlete |
| `/api/members/:id/status`| `PATCH` | Toggle member status (`active`, `frozen`, `expired`) |
| `/api/classes` | `GET`, `POST` | Fitness class schedule & scheduling |
| `/api/classes/:id/spots` | `PATCH` | Reserve or release spots in group sessions |
| `/api/payments` | `GET`, `POST` | Payment records and revenue ledger |
| `/api/dashboard` | `GET` | Aggregated gym metrics & KPIs |
| `/api/auth/session` | `POST` | Session verification & cookie issue |
