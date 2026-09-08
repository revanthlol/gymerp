import { db, pool } from "./index";
import {
  tenants,
  users,
  membershipPlans,
  members,
  memberships,
  payments,
  attendance,
} from "./schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding GymERP database...");

  // Temporarily disable RLS for bulk administrative seeding
  await db.execute(sql`
    ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
    ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
    ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
    ALTER TABLE members DISABLE ROW LEVEL SECURITY;
    ALTER TABLE membership_plans DISABLE ROW LEVEL SECURITY;
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
    ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
  `);

  try {
    // Clear existing rows (in reverse dependency order)
    await db.execute(
      sql`TRUNCATE TABLE attendance, payments, memberships, members, membership_plans, users, tenants CASCADE;`
    );

    // 1. Create Platform Superadmin
    console.log("Creating Platform Superadmin user...");
    const [platformUser] = await db
      .insert(users)
      .values({
        firebaseUid: "uid_platform_superadmin",
        role: "platform",
        email: "platform@gymerp.local",
        fullName: "Platform Superadmin",
      })
      .returning();

    // 2. Create Tenants
    console.log("Creating Tenants...");
    const [tenant1] = await db
      .insert(tenants)
      .values({
        name: "Iron Pulse Fitness",
        slug: "iron-pulse",
        status: "active",
        contactEmail: "contact@ironpulse.local",
        phone: "+91 98765 43210",
        licenseExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      })
      .returning();

    const [tenant2] = await db
      .insert(tenants)
      .values({
        name: "Apex Combat Club",
        slug: "apex-combat",
        status: "trial",
        contactEmail: "admin@apexcombat.local",
        phone: "+91 91234 56789",
        licenseExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      })
      .returning();

    // 3. Create Tenant Users (Admin & Staff for Iron Pulse)
    console.log("Creating Admin & Staff users...");
    const [adminUser] = await db
      .insert(users)
      .values({
        firebaseUid: "uid_admin_ironpulse",
        tenantId: tenant1.id,
        role: "admin",
        email: "admin@ironpulse.local",
        fullName: "Vikram Malhotra",
      })
      .returning();

    const [staffUser] = await db
      .insert(users)
      .values({
        firebaseUid: "uid_staff_ironpulse",
        tenantId: tenant1.id,
        role: "staff",
        email: "staff@ironpulse.local",
        fullName: "Ananya Sharma",
      })
      .returning();

    // 4. Create Membership Plans for Iron Pulse
    console.log("Creating Membership Plans...");
    const [monthlyPlan] = await db
      .insert(membershipPlans)
      .values({
        tenantId: tenant1.id,
        name: "Monthly Strength Pass",
        description: "Unlimited gym access with locker room access",
        price: "49.00",
        durationDays: 30,
        isActive: "true",
      })
      .returning();

    const [annualPlan] = await db
      .insert(membershipPlans)
      .values({
        tenantId: tenant1.id,
        name: "Annual VIP All-Access",
        description: "Access to gym, sauna, MMA zone, and towel service",
        price: "399.00",
        durationDays: 365,
        isActive: "true",
      })
      .returning();

    // Create a plan for Tenant 2 (for isolation testing)
    const [tenant2Plan] = await db
      .insert(membershipPlans)
      .values({
        tenantId: tenant2.id,
        name: "Apex Boxing Monthly",
        description: "Boxing ring access and heavy bag zone",
        price: "75.00",
        durationDays: 30,
        isActive: "true",
      })
      .returning();

    // 5. Create Members for Iron Pulse
    console.log("Creating Members...");
    const [member1] = await db
      .insert(members)
      .values({
        tenantId: tenant1.id,
        fullName: "Rohan Varma",
        phone: "+91 99887 76655",
        email: "rohan@example.com",
        gender: "male",
        dateOfBirth: "1994-05-12",
        status: "active",
        joinDate: "2026-01-15",
      })
      .returning();

    const [member2] = await db
      .insert(members)
      .values({
        tenantId: tenant1.id,
        fullName: "Priya Nair",
        phone: "+91 98877 66554",
        email: "priya@example.com",
        gender: "female",
        dateOfBirth: "1998-11-20",
        status: "active",
        joinDate: "2026-02-01",
      })
      .returning();

    // Member for Tenant 2 (Apex Combat)
    const [memberTenant2] = await db
      .insert(members)
      .values({
        tenantId: tenant2.id,
        fullName: "Kabir Khan",
        phone: "+91 91122 33445",
        email: "kabir@example.com",
        status: "active",
        joinDate: "2026-02-10",
      })
      .returning();

    // 6. Create Memberships
    console.log("Creating Memberships...");
    const [membership1] = await db
      .insert(memberships)
      .values({
        tenantId: tenant1.id,
        memberId: member1.id,
        planId: annualPlan.id,
        startDate: "2026-01-15",
        endDate: "2027-01-15",
        status: "active",
      })
      .returning();

    const [membership2] = await db
      .insert(memberships)
      .values({
        tenantId: tenant1.id,
        memberId: member2.id,
        planId: monthlyPlan.id,
        startDate: "2026-02-01",
        endDate: "2026-03-03",
        status: "active",
      })
      .returning();

    // 7. Create Payments
    console.log("Creating Payments...");
    await db.insert(payments).values([
      {
        tenantId: tenant1.id,
        memberId: member1.id,
        membershipId: membership1.id,
        amount: "399.00",
        method: "razorpay",
        status: "paid",
        razorpayPaymentId: "pay_sample_test_01",
        paidAt: new Date(),
        notes: "Annual membership online payment",
      },
      {
        tenantId: tenant1.id,
        memberId: member2.id,
        membershipId: membership2.id,
        amount: "49.00",
        method: "manual",
        status: "paid",
        paidAt: new Date(),
        notes: "Cash collection at front desk",
      },
    ]);

    // 8. Create Sample Attendance
    console.log("Creating Attendance records...");
    await db.insert(attendance).values([
      {
        tenantId: tenant1.id,
        memberId: member1.id,
        checkedInAt: new Date(Date.now() - 3600 * 1000), // 1 hr ago
        method: "qr",
        kioskId: "desk_terminal_01",
      },
      {
        tenantId: tenant1.id,
        memberId: member2.id,
        checkedInAt: new Date(Date.now() - 7200 * 1000), // 2 hrs ago
        method: "qr",
        kioskId: "desk_terminal_01",
      },
    ]);

    console.log("✅ Database seeded successfully!");
    console.log(`- Tenant 1: ${tenant1.name} (ID: ${tenant1.id})`);
    console.log(`- Tenant 2: ${tenant2.name} (ID: ${tenant2.id})`);
    console.log(`- Platform User: ${platformUser.email}`);
    console.log(`- Admin User: ${adminUser.email}`);
    console.log(`- Staff User: ${staffUser.email}`);
  } finally {
    // Re-enable and force RLS across all tables
    await db.execute(sql`
      ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
      ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
      ALTER TABLE members ENABLE ROW LEVEL SECURITY;
      ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

      ALTER TABLE attendance FORCE ROW LEVEL SECURITY;
      ALTER TABLE payments FORCE ROW LEVEL SECURITY;
      ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
      ALTER TABLE members FORCE ROW LEVEL SECURITY;
      ALTER TABLE membership_plans FORCE ROW LEVEL SECURITY;
      ALTER TABLE users FORCE ROW LEVEL SECURITY;
      ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
    `);
  }
}

seed()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(() => pool.end());
