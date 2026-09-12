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
export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    status: tenantStatusEnum("status").default("trial").notNull(),
    contactEmail: text("contact_email"),
    phone: text("phone"),
    logoUrl: text("logo_url"),
    licenseExpiresAt: timestamp("license_expires_at", { withTimezone: true }),
    kioskPassphrase: text("kiosk_passphrase").default("123456"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("tenants_slug_idx").on(table.slug),
  ]
);

// 2. Users Table (Platform superadmins, Gym Admins, Front-Desk Staff)
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firebaseUid: text("firebase_uid").notNull().unique(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }), // null for platform role
    role: userRoleEnum("role").notNull(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("users_tenant_idx").on(table.tenantId),
    uniqueIndex("users_firebase_uid_idx").on(table.firebaseUid),
  ]
);

// 3. Membership Plans (Configured per gym)
export const membershipPlans = pgTable(
  "membership_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    durationDays: integer("duration_days").notNull(),
    isActive: text("is_active").default("true").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("plans_tenant_idx").on(table.tenantId),
  ]
);

// 4. Members (Gym clients - Unauthenticated records)
export const members = pgTable(
  "members",
  {
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
    notes: text("notes"),
    qrToken: uuid("qr_token").defaultRandom().notNull().unique(),
    joinDate: date("join_date").defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("members_tenant_idx").on(table.tenantId),
    uniqueIndex("members_qr_token_idx").on(table.qrToken),
    index("members_phone_idx").on(table.phone),
  ]
);

// 5. Memberships (Subscriptions linking members to plans)
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    planId: uuid("plan_id").references(() => membershipPlans.id, { onDelete: "restrict" }).notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: membershipStatusEnum("status").default("active").notNull(),
    autoRenew: text("auto_renew").default("false").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("memberships_tenant_idx").on(table.tenantId),
    index("memberships_member_idx").on(table.memberId),
    index("memberships_end_date_idx").on(table.endDate),
  ]
);

// 6. Payments (Financial transactions)
export const payments = pgTable(
  "payments",
  {
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
  },
  (table) => [
    index("payments_tenant_idx").on(table.tenantId),
    index("payments_member_idx").on(table.memberId),
  ]
);

// 7. Attendance (Check-in activity log)
export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }).defaultNow().notNull(),
    method: text("method").default("qr").notNull(),
    kioskId: text("kiosk_id"),
  },
  (table) => [
    index("attendance_tenant_idx").on(table.tenantId),
    index("attendance_member_idx").on(table.memberId),
    index("attendance_date_idx").on(table.checkedInAt),
  ]
);

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  members: many(members),
  plans: many(membershipPlans),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [members.tenantId],
    references: [tenants.id],
  }),
  memberships: many(memberships),
  payments: many(payments),
  attendance: many(attendance),
}));

export const membershipPlansRelations = relations(membershipPlans, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [membershipPlans.tenantId],
    references: [tenants.id],
  }),
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [memberships.tenantId],
    references: [tenants.id],
  }),
  member: one(members, {
    fields: [memberships.memberId],
    references: [members.id],
  }),
  plan: one(membershipPlans, {
    fields: [memberships.planId],
    references: [membershipPlans.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [payments.tenantId],
    references: [tenants.id],
  }),
  member: one(members, {
    fields: [payments.memberId],
    references: [members.id],
  }),
  membership: one(memberships, {
    fields: [payments.membershipId],
    references: [memberships.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  tenant: one(tenants, {
    fields: [attendance.tenantId],
    references: [tenants.id],
  }),
  member: one(members, {
    fields: [attendance.memberId],
    references: [members.id],
  }),
}));

// 8. Classes (Group Fitness Sessions)
export const gymClasses = pgTable(
  "gym_classes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    trainer: text("trainer").notNull(),
    time: text("time").notNull(),
    durationMinutes: integer("duration_minutes").default(60).notNull(),
    dayOfWeek: text("day_of_week").default("Daily").notNull(),
    location: text("location").default("Main Studio").notNull(),
    capacity: integer("capacity").default(20).notNull(),
    bookedCount: integer("booked_count").default(0).notNull(),
    category: text("category").default("Strength").notNull(),
    isActive: text("is_active").default("true").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("gym_classes_tenant_idx").on(table.tenantId),
  ]
);

export const gymClassesRelations = relations(gymClasses, ({ one }) => ({
  tenant: one(tenants, {
    fields: [gymClasses.tenantId],
    references: [tenants.id],
  }),
}));

