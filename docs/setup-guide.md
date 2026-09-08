# GymERP — Comprehensive Developer Setup & Runbook

This guide covers the complete local setup, database provisioning, Firebase project configuration, Row-Level Security (RLS) enforcement, and operational verification procedures for **GymERP**.

---

## 1. System Architecture Overview

GymERP uses a decoupled, defense-in-depth architecture:
- **Frontend & App Tier**: Next.js 14+ (App Router) with React Server Components (RSC) and Server Actions.
- **Identity & Auth**: Firebase Auth for client authentication; Firebase Admin SDK on the server manages custom claims (`role`, `tenant_id`) and generates HTTP-only session cookies (`__session`).
- **Database**: PostgreSQL 16 (local via Docker Compose, production on dedicated VPS) managed via **Drizzle ORM**.
- **Multi-Tenant Isolation**: Dual-enforced:
  1. *Application Layer*: Drizzle tenant query wrappers (`where: eq(table.tenantId, tenantId)`).
  2. *Database Layer*: PostgreSQL Row-Level Security policies evaluating `SET LOCAL app.current_tenant_id`.
- **File Storage**: Firebase Storage for member avatars and gym branding assets.

---

## 2. Environment Prerequisites

Before beginning, install and configure:

| Component | Minimum Version | Installation Check |
|---|---|---|
| **Node.js** | `v20.10.0` (LTS) | `node --version` |
| **pnpm** | `v9.0.0` | `pnpm --version` |
| **Docker Engine** | `v24.0.0` | `docker --version` |
| **Docker Compose** | `v2.20.0` | `docker compose version` |
| **Git** | `v2.30.0` | `git --version` |

If `pnpm` is not installed:
```bash
corepack enable
corepack prepare pnpm@latest --activate
```

---

## 3. Firebase Console Configuration

GymERP requires a Google Firebase project for authentication and file storage.

### Step 3.1: Create Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it (e.g., `gymerp-dev`).
3. Disable Google Analytics (optional for development) and click **Create Project**.

### Step 3.2: Enable Email/Password Authentication
1. In the Firebase Console sidebar, go to **Build** > **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Email/Password**.
4. Enable **Email/Password** and click **Save**. (Leave Email link / passwordless disabled).

### Step 3.3: Register Web App & Obtain Client SDK Keys
1. In the Firebase Project Overview, click the **Web icon (`</>`)** to register an app.
2. Enter the app nickname (e.g., `GymERP Web Local`) and click **Register app**.
3. Copy the configuration keys from the `firebaseConfig` object into your `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="gymerp-dev.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="gymerp-dev"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="gymerp-dev.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
   NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abcdef..."
   ```

### Step 3.4: Generate Firebase Admin SDK Private Key
1. Go to **Project Settings** (gear icon in the top left) > **Service accounts**.
2. Ensure **Node.js** is selected.
3. Click **Generate new private key**, then confirm **Generate key**.
4. Open the downloaded JSON file. Extract:
   - `project_id` -> `FIREBASE_PROJECT_ID`
   - `client_email` -> `FIREBASE_CLIENT_EMAIL`
   - `private_key` -> `FIREBASE_PRIVATE_KEY`

> [!IMPORTANT]
> The private key contains escaped newline characters (`\n`). In `.env.local`, keep the private key wrapped in double quotes exactly as formatted in the JSON download, or store as a base64 encoded string if your environment runner prefers.

### Step 3.5: Configure Firebase Storage Rules
1. In the sidebar, navigate to **Build** > **Storage** and click **Get Started**.
2. Choose **Start in production mode** and pick your regional bucket location.
3. Replace the default rules under the **Rules** tab with tenant-isolated rules:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       // Only authenticated users with valid tenant_id claim can read/write tenant assets
       match /tenants/{tenantId}/{allPaths=**} {
         allow read: if request.auth != null && (request.auth.token.role == 'platform' || request.auth.token.tenant_id == tenantId);
         allow write: if request.auth != null && request.auth.token.tenant_id == tenantId;
       }
       // Member profile photos
       match /members/{tenantId}/{memberId}/{fileName} {
         allow read: if request.auth != null && request.auth.token.tenant_id == tenantId;
         allow write: if request.auth != null && request.auth.token.tenant_id == tenantId;
       }
     }
   }
   ```
4. Click **Publish**.

---

## 4. Local Database Setup (Docker PostgreSQL 16)

GymERP runs PostgreSQL 16 inside Docker Compose for predictable parity with production VMs.

### Step 4.1: Inspect `docker-compose.yml`
The root `docker-compose.yml` defines the PostgreSQL service:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: gymerp-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-gymerp}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-gymerp_secret_dev_pass}
      POSTGRES_DB: ${POSTGRES_DB:-gymerp}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-gymerp} -d ${POSTGRES_DB:-gymerp}"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
```

### Step 4.2: Start Container & Verify Health
```bash
# Start PostgreSQL container in background
docker compose up -d

# Verify container is running and healthy
docker compose ps
```

To test connecting with `psql` directly:
```bash
docker compose exec postgres psql -U gymerp -d gymerp -c "SELECT version();"
```

---

## 5. Drizzle ORM Schema & Migrations

GymERP uses Drizzle ORM for type-safe relational queries and automated migrations.

### Step 5.1: Drizzle Configuration (`drizzle.config.ts`)
```typescript
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
```

### Step 5.2: Database Migration Commands

```bash
# Generate SQL migration files from Drizzle schema updates
pnpm db:generate

# Execute pending SQL migrations against target database
pnpm db:migrate

# Push schema directly to database (ideal for rapid local prototyping)
pnpm db:push

# Open graphical database inspector in browser
pnpm db:studio
```

---

## 6. PostgreSQL Row-Level Security (RLS) Setup

GymERP implements **defense-in-depth** RLS policies so the database engine rejects cross-tenant data leaks even if an application query omits a filter.

### Step 6.1: How Session Tenancy Works
When Next.js Server Actions or API routes run a database transaction, they set session variables scoped to that specific transaction:

```typescript
// src/lib/db/tenant-scope.ts
import { db } from "./index";
import { sql } from "drizzle-orm";

export async function withTenantScope<T>(
  tenantId: string,
  role: "admin" | "staff" | "platform",
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    // Set transaction-local session variables
    await tx.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`);
    await tx.execute(sql`SET LOCAL app.current_role = ${role}`);
    return await callback(tx);
  });
}
```

### Step 6.2: Core RLS SQL Migration Script
Applied via `drizzle/migrations/0001_enable_rls.sql`:

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 1. Tenants Table:
-- Platform role can read and update all tenants.
-- Gym admins and staff can only read their own tenant.
CREATE POLICY tenants_platform_policy ON tenants
  FOR ALL
  USING (current_setting('app.current_role', true) = 'platform');

CREATE POLICY tenants_tenant_read_policy ON tenants
  FOR SELECT
  USING (id::text = current_setting('app.current_tenant_id', true));

-- 2. Users Table:
-- Platform can read all users. Admins can manage users in their tenant.
CREATE POLICY users_platform_policy ON users
  FOR ALL
  USING (current_setting('app.current_role', true) = 'platform');

CREATE POLICY users_tenant_policy ON users
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- 3. Hard Boundary: Members, Plans, Memberships, Payments, Attendance
-- CRITICAL: Platform role has NO access policy here. Evaluates FALSE for platform.
CREATE POLICY members_tenant_isolation ON members
  FOR ALL
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) IN ('admin', 'staff')
  );

CREATE POLICY plans_tenant_isolation ON membership_plans
  FOR ALL
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) IN ('admin', 'staff')
  );

CREATE POLICY memberships_tenant_isolation ON memberships
  FOR ALL
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) IN ('admin', 'staff')
  );

CREATE POLICY payments_tenant_isolation ON payments
  FOR ALL
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) IN ('admin', 'staff')
  );

CREATE POLICY attendance_tenant_isolation ON attendance
  FOR ALL
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) IN ('admin', 'staff')
  );
```

---

## 7. Database Seeding & Verification Runbook

### Step 7.1: Run Seeder
```bash
pnpm db:seed
```

The seeder creates:
1. **Tenants**:
   - `Iron Pulse Fitness` (`status: active`)
   - `Apex Combat Club` (`status: trial`)
   - `Metro Titan Gym` (`status: suspended`)
2. **Users & Custom Claims**:
   - Platform Superadmin: `platform@gymerp.local` (`role: platform`, `tenant_id: null`)
   - Iron Pulse Admin: `admin@ironpulse.local` (`role: admin`, `tenant_id: <iron-pulse-id>`)
   - Iron Pulse Staff: `staff@ironpulse.local` (`role: staff`, `tenant_id: <iron-pulse-id>`)
3. **Sample Data for Iron Pulse**:
   - 3 Plans: Monthly Pass ($49), Quarterly VIP ($129), Annual Pro ($399).
   - 12 Active Members with generated `qr_token` values.
   - Sample payments and 24-hour attendance records.

### Step 7.2: Verify Multi-Tenant RLS Enforcement
Run the verification test script:
```bash
pnpm test:rls
```

The test runs 3 automated sanity checks:
1. **Cross-Tenant Leak Check**: Setting `app.current_tenant_id` to Tenant A and querying for Tenant B's members returns `0 rows`.
2. **Platform Privacy Check**: Setting `app.current_role = 'platform'` and executing `SELECT count(*) FROM members` returns `0 rows` (access denied by RLS).
3. **Admin Full Access Check**: Setting `app.current_role = 'admin'` and `app.current_tenant_id` to Tenant A returns all of Tenant A's members and plans.

---

## 8. Development Server & Verification

Start the Next.js development server:
```bash
pnpm dev
```

Visit the application routes:
- **Authentication**: `http://localhost:3000/login`
- **Platform Console**: `http://localhost:3000/platform`
- **Gym Admin Dashboard**: `http://localhost:3000/admin`
- **Front-Desk Kiosk Terminal**: `http://localhost:3000/staff/kiosk`

---

## 9. Production Deployment Runbook (Phase B Parity)

When deploying to a dedicated Linux VM (Ubuntu 22.04 LTS on AWS EC2, Hetzner, or Oracle Cloud):

### 9.1 VM Host Setup
```bash
# Install Docker and Compose plugin
sudo apt update && sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### 9.2 Automated PostgreSQL Backups
Create a daily automated backup cron job (`/etc/cron.daily/backup-gymerp-postgres`):
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/gymerp"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"
docker exec gymerp-postgres pg_dump -U gymerp gymerp | gzip > "$BACKUP_DIR/gymerp_$TIMESTAMP.sql.gz"
# Keep 30 days of retention
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -delete
```
```bash
chmod +x /etc/cron.daily/backup-gymerp-postgres
```

### 9.3 Vercel Environment Configuration
When linking the Next.js app to Vercel:
1. Set `DATABASE_URL` pointing to the production PostgreSQL server (with SSL mode enabled: `sslmode=require`).
2. Add all `NEXT_PUBLIC_FIREBASE_*` variables.
3. Pass `FIREBASE_PRIVATE_KEY` and `FIREBASE_CLIENT_EMAIL`.
4. Deploy with `vercel --prod`.
