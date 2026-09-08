# GymERP — Developer Setup & Quickstart

Fast setup runbook for local development with **Next.js 14+**, **Docker PostgreSQL 16**, **Drizzle ORM**, and **Firebase Auth**.

For architectural deep dive and production deployment instructions, see [docs/setup-guide.md](file:///home/rev/Documents/projects/gymerp/docs/setup-guide.md).

---

## Prerequisites

Ensure the following tools are installed on your machine:
- **Node.js**: `v20.10.0+` (LTS recommended)
- **pnpm**: `v9.0.0+` (`corepack enable && corepack prepare pnpm@latest --activate` or `npm i -g pnpm`)
- **Docker & Docker Compose**: Docker Engine `v24+` / Docker Desktop
- **Firebase Project**: A free Google Firebase project with **Authentication (Email/Password)** enabled

---

## 5-Minute Quickstart

### 1. Clone Repository & Install Dependencies
```bash
git clone <repo-url> gymerp
cd gymerp
pnpm install
```

### 2. Configure Environment Variables
Copy the template configuration file:
```bash
cp .env.example .env.local
```

Open `.env.local` and populate:
1. **Firebase Client SDK credentials**: Obtain from Firebase Console > **Project Settings** > **General** > **Your apps** (Web).
2. **Firebase Admin SDK credentials**: Obtain from Firebase Console > **Project Settings** > **Service accounts** > **Generate new private key**.

### 3. Launch Local PostgreSQL Database
Spin up the local PostgreSQL 16 container with persistent storage and healthcheck:
```bash
docker compose up -d
```

Verify the database container is healthy:
```bash
docker compose ps
```
*(Should display `gymerp-postgres` with state `Up (healthy)` on port `5432`)*.

### 4. Push Database Schema & Seed Data
Generate and apply the Drizzle schema migrations to PostgreSQL:
```bash
# Push schema definitions directly to local DB
pnpm db:push

# (Optional) Run database seeder with demo tenants, admin, and test members
pnpm db:seed
```

### 5. Start Development Server
Start the Next.js development server with hot reloading:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Key Development Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Starts Next.js development server at `http://localhost:3000` |
| `pnpm build` | Compiles production Next.js application |
| `pnpm start` | Runs compiled production build |
| `pnpm lint` | Runs ESLint checks |
| `pnpm typecheck` | Runs TypeScript static type validation (`tsc --noEmit`) |
| `docker compose up -d` | Starts PostgreSQL container in background |
| `docker compose down` | Stops PostgreSQL container |
| `docker compose down -v` | Stops PostgreSQL and deletes local database volume |
| `pnpm db:generate` | Generates SQL migration files from Drizzle schema |
| `pnpm db:migrate` | Runs pending SQL migration files against target DB |
| `pnpm db:push` | Synchronizes Drizzle schema directly to DB without migration files |
| `pnpm db:studio` | Launches Drizzle Studio GUI at `https://local.drizzle.studio` |
| `pnpm db:seed` | Populates database with sample tenants, plans, and members |

---

## Seed Accounts (Local Testing)

Running `pnpm db:seed` provisions test users in PostgreSQL and syncs them to Firebase Auth emulator/cloud:

| Role | Email | Password | Tenant Scope | Access Level |
|---|---|---|---|---|
| **Platform Superadmin** | `platform@gymerp.local` | `Admin12345!` | `null` (Global) | Manages gyms, subscription status, system KPIs. Zero access to member PII. |
| **Gym Admin** | `admin@ironpulse.local` | `Admin12345!` | Iron Pulse Gym (`tenant_id: ...`) | Full control within tenant: members, plans, staff, finance. |
| **Front-Desk Staff** | `staff@ironpulse.local` | `Staff12345!` | Iron Pulse Gym (`tenant_id: ...`) | Member lookups, check-in kiosk terminal, manual fee collection. |

---

## Interactive UI Prototypes

To preview the responsive UI design system and workflows before database initialization:
```bash
# Open demo portal index directly in browser
open docs/demo/index.html
# or with python static server:
python3 -m http.server 8080 -d docs/demo
```
Accessible at [http://localhost:8080](http://localhost:8080).

---

## Troubleshooting

### Postgres Port Conflict (Address already in use: 5432)
If you have a local PostgreSQL service running on port 5432:
1. Change `POSTGRES_PORT=5433` in `.env.local`
2. Update the `ports` mapping in `docker-compose.yml`: `"${POSTGRES_PORT:-5433}:5432"`
3. Update `DATABASE_URL` in `.env.local`: `postgresql://gymerp:gymerp_secret_dev_pass@localhost:5433/gymerp?sslmode=disable`

### Firebase Admin Private Key Formatting
In `.env.local`, the `FIREBASE_PRIVATE_KEY` must preserve escaped newlines (`\n`). If using dotenv, wrap in quotes:
```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgw...\n-----END PRIVATE KEY-----\n"
```
Or use base64 encoding if preferred by the helper in `src/lib/firebase/admin.ts`.

---

For deeper architectural specs, Row-Level Security policies, and production deployment checklists, read [docs/setup-guide.md](file:///home/rev/Documents/projects/gymerp/docs/setup-guide.md).
