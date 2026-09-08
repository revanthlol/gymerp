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
import { adminAuth } from "../firebase/admin";

async function getOrCreateFirebaseUser(
  email: string,
  password: string,
  displayName: string,
  role: "platform" | "admin" | "staff",
  tenantId: string | null
): Promise<string> {
  try {
    let uid: string;
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      uid = existingUser.uid;
      await adminAuth.updateUser(uid, { password, displayName });
      console.log(`  Updated existing Firebase user: ${email} (${uid})`);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        const newUser = await adminAuth.createUser({
          email,
          password,
          displayName,
        });
        uid = newUser.uid;
        console.log(`  Created new Firebase user: ${email} (${uid})`);
      } else {
        throw err;
      }
    }

    // Assign custom user claims
    await adminAuth.setCustomUserClaims(uid, {
      role,
      tenant_id: tenantId,
    });
    console.log(`  Set custom claims for ${email}: role=${role}, tenant_id=${tenantId}`);
    return uid;
  } catch (err) {
    console.warn(`  ⚠️ Could not sync ${email} to Firebase Auth (offline or invalid key?):`, err);
    return `uid_mock_${role}_${Math.random().toString(36).slice(-6)}`;
  }
}

async function seed() {
  console.log("🌱 Seeding GymERP database & syncing Firebase Auth...");

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

    // 1. Create Tenants first so tenantId is known for users
    console.log("\n1. Creating Tenants...");
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

    // 2. Create and Sync Firebase Users
    console.log("\n2. Provisioning Users in Firebase Auth & PostgreSQL...");

    const platformUid = await getOrCreateFirebaseUser(
      "platform@gymerp.local",
      "Admin12345!",
      "Platform Superadmin",
      "platform",
      null
    );

    const [platformUser] = await db
      .insert(users)
      .values({
        firebaseUid: platformUid,
        role: "platform",
        email: "platform@gymerp.local",
        fullName: "Platform Superadmin",
      })
      .returning();

    const adminUid = await getOrCreateFirebaseUser(
      "admin@ironpulse.local",
      "Admin12345!",
      "Vikram Malhotra",
      "admin",
      tenant1.id
    );

    const [adminUser] = await db
      .insert(users)
      .values({
        firebaseUid: adminUid,
        tenantId: tenant1.id,
        role: "admin",
        email: "admin@ironpulse.local",
        fullName: "Vikram Malhotra",
      })
      .returning();

    const staffUid = await getOrCreateFirebaseUser(
      "staff@ironpulse.local",
      "Staff12345!",
      "Ananya Sharma",
      "staff",
      tenant1.id
    );

    const [staffUser] = await db
      .insert(users)
      .values({
        firebaseUid: staffUid,
        tenantId: tenant1.id,
        role: "staff",
        email: "staff@ironpulse.local",
        fullName: "Ananya Sharma",
      })
      .returning();

    // 3. Create Membership Plans for Iron Pulse
    console.log("\n3. Creating Membership Plans...");
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
    await db.insert(membershipPlans).values({
      tenantId: tenant2.id,
      name: "Apex Boxing Monthly",
      description: "Boxing ring access and heavy bag zone",
      price: "75.00",
      durationDays: 30,
      isActive: "true",
    });

    // 4. Create Members for Iron Pulse
    console.log("\n4. Creating Members...");
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
    await db.insert(members).values({
      tenantId: tenant2.id,
      fullName: "Kabir Khan",
      phone: "+91 91122 33445",
      email: "kabir@example.com",
      status: "active",
      joinDate: "2026-02-10",
    });

    // 5. Create Memberships
    console.log("\n5. Creating Memberships...");
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

    // 6. Create Payments
    console.log("\n6. Creating Payments...");
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

    // 7. Create Sample Attendance
    console.log("\n7. Creating Attendance records...");
    await db.insert(attendance).values([
      {
        tenantId: tenant1.id,
        memberId: member1.id,
        checkedInAt: new Date(Date.now() - 3600 * 1000),
        method: "qr",
        kioskId: "desk_terminal_01",
      },
      {
        tenantId: tenant1.id,
        memberId: member2.id,
        checkedInAt: new Date(Date.now() - 7200 * 1000),
        method: "qr",
        kioskId: "desk_terminal_01",
      },
    ]);

    console.log("\n=======================================================");
    console.log("✅ Database seeded & Firebase Auth synchronized!");
    console.log(`- Tenant 1: ${tenant1.name} (ID: ${tenant1.id})`);
    console.log(`- Tenant 2: ${tenant2.name} (ID: ${tenant2.id})`);
    console.log(`- Platform User: ${platformUser.email} / Admin12345!`);
    console.log(`- Admin User:    ${adminUser.email} / Admin12345!`);
    console.log(`- Staff User:    ${staffUser.email} / Staff12345!`);
    console.log("=======================================================\n");
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
