# Phase 0 — Foundation: PostgreSQL Schema, Drizzle ORM, RLS & Firebase Auth

> **Mandatory Security Rule:**
> Multi-tenancy is enforced with **defense-in-depth**:
> 1. **Application Layer:** Drizzle tenant repository queries always filter by `tenant_id`.
> 2. **Database Layer (RLS):** PostgreSQL Row-Level Security enforces tenant isolation via `SET LOCAL app.current_tenant_id`.
> 3. **Privacy Invariant:** The `platform` superadmin role has **zero** RLS access path to member-level tables (`members`, `payments`, `attendance`, `memberships`, `membership_plans`).

---

## 1. Objectives & Scope

1. Provision local PostgreSQL 16 via Docker Compose.
2. Define type-safe schema definitions in Drizzle ORM with foreign keys, indexes, and constraints.
3. Configure PostgreSQL Row-Level Security (RLS) policies for all tables.
4. Build `withTenantScope` transaction wrapper for Drizzle.
5. Set up Firebase Admin SDK with custom claims (`role`, `tenant_id`).
6. Implement database seeding and automated RLS verification test scripts.

---

## 2. Drizzle ORM TypeScript Schema (`src/lib/db/schema.ts`)

```typescript
import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  date,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const tenantStatusEnum = pgEnum("tenant_status", ["trial", "active", "suspended"]);
export const userRoleEnum = pgEnum("user_role", ["platform", "admin", "staff"]);
export const memberStatusEnum = pgEnum("member_status", ["active", "expired", "frozen"]);
export const membershipStatusEnum = pgEnum("membership_status", ["active", "expired", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["razorpay", "manual"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed"]);

// 1. Tenants Table (Gyms / Dojos)
export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: tenantStatusEnum("status").default("trial").notNull(),
  contactEmail: text("contact_email"),
  phone: text("phone"),
  logoUrl: text("logo_url"),
  licenseExpiresAt: timestamp("license_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Users Table (Platform superadmins, Gym Admins, Front-Desk Staff)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }), // null for platform role
  role: userRoleEnum("role").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("users_tenant_idx").on(table.tenantId),
  index("users_firebase_uid_idx").on(table.firebaseUid),
]);

// 3. Membership Plans (Configured per gym)
export const membershipPlans = pgTable("membership_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  durationDays: integer("duration_days").notNull(),
  isActive: text("is_active").default("true").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("plans_tenant_idx").on(table.tenantId),
]);

// 4. Members (Athletes, clients - Records without login credentials)
export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  gender: text("gender"),
  dateOfBirth: date("date_of_birth"),
  emergencyContact: text("emergency_contact"),
  avatarUrl: text("avatar_url"),
  status: memberStatusEnum("status").default("active").notNull(),
  qrToken: uuid("qr_token").defaultRandom().notNull().unique(),
  joinDate: date("join_date").defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("members_tenant_idx").on(table.tenantId),
  uniqueIndex("members_qr_token_idx").on(table.qrToken),
  index("members_phone_idx").on(table.phone),
]);

// 5. Memberships (Subscriptions linking members to plans)
export const memberships = pgTable("memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  planId: uuid("plan_id").references(() => membershipPlans.id, { onDelete: "restrict" }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: membershipStatusEnum("status").default("active").notNull(),
  autoRenew: text("auto_renew").default("false").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("memberships_tenant_idx").on(table.tenantId),
  index("memberships_member_idx").on(table.memberId),
  index("memberships_end_date_idx").on(table.endDate),
]);

// 6. Payments (Financial transactions)
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  membershipId: uuid("membership_id").references(() => memberships.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").notNull(),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  notes: text("notes"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("payments_tenant_idx").on(table.tenantId),
  index("payments_member_idx").on(table.memberId),
]);

// 7. Attendance (Check-in log)
export const attendance = pgTable("attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }).defaultNow().notNull(),
  method: text("method").default("qr").notNull(), // 'qr' | 'manual'
  kioskId: text("kiosk_id"),
}, (table) => [
  index("attendance_tenant_idx").on(table.tenantId),
  index("attendance_member_idx").on(table.memberId),
  index("attendance_date_idx").on(table.checkedInAt),
]);
```

---

## 3. PostgreSQL Row-Level Security Policies (`0001_enable_rls.sql`)

PostgreSQL RLS policies are applied directly to the database engine:

```sql
-- Enable RLS across all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1. Tenants Table
-- -----------------------------------------------------------------------------
CREATE POLICY tenants_platform_all ON tenants
  FOR ALL
  USING (current_setting('app.current_role', true) = 'platform');

CREATE POLICY tenants_tenant_select ON tenants
  FOR SELECT
  USING (id::text = current_setting('app.current_tenant_id', true));

-- -----------------------------------------------------------------------------
-- 2. Users Table
-- -----------------------------------------------------------------------------
CREATE POLICY users_platform_all ON users
  FOR ALL
  USING (current_setting('app.current_role', true) = 'platform');

CREATE POLICY users_tenant_scoped ON users
  FOR ALL
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) IN ('admin', 'staff')
  );

-- -----------------------------------------------------------------------------
-- 3. Tenant-Scoped Tables (Hard Isolation)
-- Notice: Platform role is completely blocked from member data.
-- -----------------------------------------------------------------------------
CREATE POLICY members_tenant_isolation ON members
  FOR ALL
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) IN ('admin', 'staff')
  );

CREATE POLICY membership_plans_select ON membership_plans
  FOR SELECT
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) IN ('admin', 'staff')
  );

CREATE POLICY membership_plans_admin_mutate ON membership_plans
  FOR INSERT
  WITH CHECK (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) = 'admin'
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

## 4. Tenant Scope Helper (`src/lib/db/tenant.ts`)

To execute database queries within a safe tenant context:

```typescript
import { db } from "./index";
import { sql } from "drizzle-orm";

export interface SessionContext {
  userId: string;
  role: "platform" | "admin" | "staff";
  tenantId: string | null;
}

export async function withTenantDb<T>(
  context: SessionContext,
  operation: (tx: any) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    if (context.role === "platform") {
      await tx.execute(sql`SET LOCAL app.current_role = 'platform'`);
      await tx.execute(sql`SET LOCAL app.current_tenant_id = ''`);
    } else {
      if (!context.tenantId) {
        throw new Error("Tenant ID required for non-platform roles");
      }
      await tx.execute(sql`SET LOCAL app.current_role = ${context.role}`);
      await tx.execute(sql`SET LOCAL app.current_tenant_id = ${context.tenantId}`);
    }
    return await operation(tx);
  });
}
```

---

## 5. Firebase Admin Custom Claims Sync

When creating or modifying staff/admin accounts, Firebase custom claims must be kept in sync:

```typescript
// src/lib/firebase/claims.ts
import { adminAuth } from "./admin";

export async function setUserClaims(
  firebaseUid: string,
  role: "platform" | "admin" | "staff",
  tenantId: string | null
) {
  await adminAuth.setCustomUserClaims(firebaseUid, {
    role,
    tenant_id: tenantId,
  });
}
```

---

## 6. Verification Checklist & Exit Criteria

- [ ] PostgreSQL 16 container running and healthy on port `5432`.
- [ ] Drizzle migrations successfully applied via `pnpm db:push` or `pnpm db:migrate`.
- [ ] RLS enabled on all 7 tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- [ ] Automated verification script `pnpm test:rls` passes:
  - [ ] Platform role cannot select from `members` (returns 0 rows).
  - [ ] Admin from Tenant 1 cannot select members belonging to Tenant 2.
  - [ ] Staff user cannot insert or update `membership_plans` price.
- [ ] Database seeder script `pnpm db:seed` executes cleanly and generates initial demo users.
