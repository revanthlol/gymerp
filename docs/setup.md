# GymERP — Developer Setup & Runbook

Fast, reproducible setup runbook for local development with **Next.js 14+**, **Fastify 4.x**, **Neon PostgreSQL**, **Drizzle ORM**, and **Firebase Auth**.

---

## 1. Prerequisites

Ensure your development environment meets the following requirements:
- **Node.js**: `v20.10.0+` (LTS recommended)
- **pnpm**: `v9.0.0+` (`corepack enable && corepack prepare pnpm@latest --activate` or `npm i -g pnpm`)
- **Neon Account**: Free serverless PostgreSQL database at [neon.tech](https://neon.tech)
- **Firebase Project**: Google Firebase project with **Authentication (Email/Password)** enabled and a generated Admin Service Account private key JSON

---

## 2. 5-Minute Quickstart

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/revanthlol/gymerp.git
cd gymerp
pnpm install
```

### Step 2: Configure Environment Variables
Copy the template configuration:
```bash
cp .env.example .env.local
```

Open `.env.local` and populate the required values:

```env
# Server Ports
PORT=4000
HOST=0.0.0.0
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (Neon pooled connection string)
DATABASE_URL="postgresql://user:password@ep-pooler.region.aws.neon.tech/gymerp?sslmode=require"

# Firebase Client SDK (Console > Project Settings > General > Web App)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="gym-erp-firebase.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="gym-erp-firebase"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="gym-erp-firebase.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."

# Firebase Admin SDK (Console > Project Settings > Service Accounts)
FIREBASE_PROJECT_ID="gym-erp-firebase"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@gym-erp-firebase.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgw...\n-----END PRIVATE KEY-----\n"

# Security & Sessions
COOKIE_SECRET="super-secret-minimum-32-character-random-string"
SESSION_COOKIE_NAME="__session"
SESSION_COOKIE_EXPIRES_IN=432000

# Frontend-to-Backend proxy URL
API_SERVER_URL="http://localhost:4000"
```

### Step 3: Synchronize Database Schema
Push the Drizzle ORM schema directly to your Neon database:
```bash
pnpm db:push
```

*(Optional)* Launch Drizzle Studio to inspect database tables in your browser:
```bash
pnpm db:studio
```

### Step 4: Seed Base Accounts & Plans
Populate the database with initial gym tenants, administrators, membership plans, and test athletes:
```bash
pnpm db:seed
```

### Step 5: Start Development Environment
Launch both the Next.js frontend (port `3000`) and the Fastify API server (port `4000`) concurrently:
```bash
pnpm dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Fastify API & Health Check: [http://localhost:4000/health](http://localhost:4000/health)

---

## 3. Development Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts Next.js (`:3000`) and Fastify API (`:4000`) concurrently |
| `pnpm dev:next` | Starts Next.js frontend only |
| `pnpm dev:api` | Starts Fastify API server only with hot reload (`tsx watch`) |
| `pnpm build` | Compiles production Next.js standalone application |
| `pnpm start` | Runs production Next.js build |
| `pnpm typecheck` | Validates TypeScript types across the entire codebase (`tsc --noEmit`) |
| `pnpm lint` | Runs ESLint rules |
| `pnpm db:push` | Pushes Drizzle schema directly to PostgreSQL without migration files |
| `pnpm db:generate` | Generates SQL migration files from Drizzle schema definitions |
| `pnpm db:migrate` | Runs pending SQL migration files against target database |
| `pnpm db:studio` | Opens local Drizzle Studio GUI for table inspection |
| `pnpm db:seed` | Provisions initial tenants, plans, and demo user accounts |

---

## 4. Default Seed Credentials

After running `pnpm db:seed`, the following accounts are available for testing:

| Role | Email | Password | Scope | Portal Entry |
| :--- | :--- | :--- | :--- | :--- |
| **Platform Superadmin** | `platform@gymerp.local` | `Admin12345!` | Global fleet (tenants only) | `/platform/login` or `Ctrl+Shift+P` |
| **Gym Admin** | `admin@ironpulse.local` | `Admin12345!` | Single gym tenant (Iron Pulse) | `/login` |
| **Front-Desk Staff** | `staff@ironpulse.local` | `Staff12345!` | Single gym tenant (Iron Pulse) | `/login` |

---

## 5. Troubleshooting & FAQ

### Firebase Admin Private Key Errors
- In `.env.local`, ensure `FIREBASE_PRIVATE_KEY` has actual escaped newline characters (`\n`) and is enclosed in double quotes.
- Alternatively, you can place your `firebase-adminsdk-*.json` service account file in the project root and reference it via `GOOGLE_APPLICATION_CREDENTIALS`.

### Neon Connection Pool Limits
- Neon databases use PgBouncer for connection pooling.
- Ensure your `DATABASE_URL` uses the `-pooler` endpoint hostname (e.g. `ep-cool-name-pooler.region.aws.neon.tech`).
- The Fastify server configures `pg.Pool` with `max: 20` and `keepAlive: true` to prevent pool exhaustion.

### Port Conflicts
- If port `3000` or `4000` is already in use, override them via:
  ```bash
  PORT=4001 pnpm dev:api
  ```
