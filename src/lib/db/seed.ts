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

    // 4. Create Members for Iron Pulse (Exact GRYM wireframe athletes)
    console.log("\n4. Creating Members (GRYM wireframe athletes)...");
    const [member1] = await db
      .insert(members)
      .values({
        tenantId: tenant1.id,
        fullName: "Sarah Cole",
        phone: "+380 (66) 237 98 54",
        email: "email_sample@gmail.com",
        gender: "Female",
        dateOfBirth: "1992-07-23",
        emergencyContact: "Korolenko Street 24, 4/51",
        status: "active",
        joinDate: "2021-11-05",
      })
      .returning();

    const [member2] = await db
      .insert(members)
      .values({
        tenantId: tenant1.id,
        fullName: "James Frau",
        phone: "+380 (95) 107 22 23",
        email: "james.frau@example.com",
        gender: "Male",
        dateOfBirth: "1990-03-15",
        status: "active",
        joinDate: "2022-03-01",
      })
      .returning();

    const [member3] = await db
      .insert(members)
      .values({
        tenantId: tenant1.id,
        fullName: "Nicole Whiston",
        phone: "+380 (50) 866 21 12",
        email: "nicole.w@example.com",
        gender: "Female",
        dateOfBirth: "1995-10-18",
        status: "active",
        joinDate: "2022-10-22",
      })
      .returning();

    const [member4] = await db
      .insert(members)
      .values({
        tenantId: tenant1.id,
        fullName: "James Cameron",
        phone: "+380 (67) 111 25 54",
        email: "j.cameron@example.com",
        gender: "Male",
        dateOfBirth: "1988-06-11",
        status: "active",
        joinDate: "2023-05-12",
      })
      .returning();

    const [member5] = await db
      .insert(members)
      .values({
        tenantId: tenant1.id,
        fullName: "Kyle Janner",
        phone: "+380 (67) 397 06 12",
        email: "kyle.j@example.com",
        gender: "Male",
        dateOfBirth: "1997-01-28",
        status: "active",
        joinDate: "2023-06-30",
      })
      .returning();

    const [member6] = await db
      .insert(members)
      .values({
        tenantId: tenant1.id,
        fullName: "Alicia Torres",
        phone: "+380 (50) 234 56 78",
        email: "alicia.t@example.com",
        gender: "Female",
        dateOfBirth: "1993-09-04",
        status: "active",
        joinDate: "2023-09-04",
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
