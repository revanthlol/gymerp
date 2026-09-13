# GymERP Production Deployment Guide

This guide details the exact production architecture, deployment runbooks, and operational configuration for GymERP.

---

## 1. System Architecture & Distribution

| Tier | Component | Host / Provider | Live Target / Configuration |
| :--- | :--- | :--- | :--- |
| **Web Frontend** | Next.js 14.2 App Router (SSR, RSC, Server Actions) | **Vercel** | `https://gymerp-liard.vercel.app` (Region: `sin1` Singapore) |
| **Backend API** | Fastify 4.x Standalone Node.js Server | **Oracle Cloud VM / VPS** | `https://gymerp.duckdns.org` (PM2 `gymerp-api`, port `4000`) |
| **Database** | PostgreSQL with Row-Level Security (RLS) | **Neon** | Serverless pooled connection (`ap-southeast-1` Singapore) |
| **Auth & Identity** | Firebase Auth + Firebase Admin SDK | **Google Cloud / Firebase** | HTTP-only session cookies with custom claims (`role`, `tenant_id`) |
| **Physical Kiosk** | Anti-proxy rotating QR terminal & camera scanner | **Front-Desk Tablet / Mini-PC** | Web PWA running `/staff/kiosk` or `/kiosk/[slug]` |

---

## 2. Database Provisioning (Neon PostgreSQL)

### Step 1: Create Database Project
1. Log into [neon.tech](https://neon.tech) and create a project in the region closest to your users (e.g. `ap-southeast-1` Singapore).
2. Under **Connection Details**, select **Pooled connection**.
3. Copy the pooled connection string:
   ```env
   DATABASE_URL="postgresql://<user>:<password>@ep-pooler.region.aws.neon.tech/neondb?sslmode=require"
   ```

### Step 2: Push Schema & Apply Policies
Run Drizzle schema migration against the remote database:
```bash
export DATABASE_URL="postgresql://<user>:<password>@ep-pooler.region.aws.neon.tech/neondb?sslmode=require"
pnpm db:push
```

*(Optional)* Seed base tenants and plans:
```bash
pnpm db:seed
```

---

## 3. Backend API Deployment (Fastify Standalone)

The dedicated Fastify backend (`src/server/index.ts`) maintains a persistent connection pool, eliminating lambda cold starts and ensuring **<50ms** turnstile check-in latency.

### Deployment via PM2 on Linux VPS (Ubuntu / Debian)

1. **SSH into your server**:
   ```bash
   ssh ubuntu@<vps-ip>
   ```

2. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/revanthlol/gymerp.git /var/www/gymerp
   cd /var/www/gymerp
   pnpm install
   ```

3. **Configure production environment (`.env.local`)**:
   ```env
   PORT=4000
   HOST=0.0.0.0
   APP_URL=https://gymerp-liard.vercel.app
   DATABASE_URL="postgresql://..."
   COOKIE_SECRET="super-secret-production-key-at-least-32-characters"
   SESSION_COOKIE_NAME="__session"
   SESSION_COOKIE_EXPIRES_IN=432000
   FIREBASE_PROJECT_ID="gym-erp-firebase"
   FIREBASE_CLIENT_EMAIL="..."
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   ```

4. **Launch PM2 process**:
   ```bash
   npm install -g pm2
   pm2 start "npx tsx src/server/index.ts" --name "gymerp-api"
   pm2 save
   pm2 startup
   ```

5. **Nginx Reverse Proxy & SSL (Certbot)**:
   ```nginx
   server {
       server_name gymerp.duckdns.org;

       location / {
           proxy_pass http://127.0.0.1:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   Generate TLS certificate:
   ```bash
   sudo certbot --nginx -d gymerp.duckdns.org
   ```

---

## 4. Frontend Deployment (Vercel)

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. **Framework Preset**: Next.js.
3. **Region Configuration (`vercel.json`)**:
   Ensure `vercel.json` pins the compute region to match Neon's location:
   ```json
   {
     "regions": ["sin1"]
   }
   ```
4. **Environment Variables**:
   Add all client and server variables in the Vercel dashboard:
   - `DATABASE_URL`
   - `API_SERVER_URL` = `https://gymerp.duckdns.org`
   - `NEXT_PUBLIC_APP_URL` = `https://gymerp-liard.vercel.app`
   - `NEXT_PUBLIC_FIREBASE_*` (Client SDK keys)
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
   - `COOKIE_SECRET`
5. Click **Deploy**.

---

## 5. Production Health Verification

After deployment, execute the following health checks:

### 1. Fastify API & Database Ping
```bash
curl -i https://gymerp.duckdns.org/health
```
Expected response (`HTTP 200`):
```json
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "pingLatencyMs": 18
  }
}
```

### 2. Frontend Connectivity
Visit `https://gymerp-liard.vercel.app` in your browser:
- Confirm landing page loads with 200 OK.
- Verify theme toggle switches between light and dark modes cleanly.
- Test member portal login at `/portal/login`.
- Test staff/admin login at `/login`.
