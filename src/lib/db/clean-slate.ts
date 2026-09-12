import { db, pool } from "./index";
import {
  tenants,
  users,
  membershipPlans,
  members,
  memberships,
  payments,
  attendance,
  gymClasses,
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

  await adminAuth.setCustomUserClaims(uid, {
    role,
    tenant_id: tenantId,
  });
  console.log(`  Set custom claims for ${email}: role=${role}, tenant_id=${tenantId}`);
  return uid;
}

async function cleanSlate() {
  console.log("🧹 Starting Clean Slate: Wiping all test gym data from Neon PostgreSQL...");

  try {
    await db.execute(sql`
      ALTER TABLE IF EXISTS attendance DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS gym_classes DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS memberships DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS members DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS membership_plans DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS tenants DISABLE ROW LEVEL SECURITY;
    `);

    // Truncate all tables
    await db.execute(sql`
      TRUNCATE TABLE 
        attendance,
        gym_classes,
        payments, 
        memberships, 
        members, 
        membership_plans, 
        users, 
        tenants 
      CASCADE;
    `);
    console.log("✅ All tenant data, members, attendance, classes, and payments truncated.");

    // Seed ONLY the Platform Superadmin
    console.log("👤 Provisioning Platform Superadmin (platform@gymerp.local)...");
    const platformUid = await getOrCreateFirebaseUser(
      "platform@gymerp.local",
      "Admin12345!",
      "Platform Superadmin",
      "platform",
      null
    );

    await db.insert(users).values({
      firebaseUid: platformUid,
      role: "platform",
      email: "platform@gymerp.local",
      fullName: "Platform Superadmin",
    });

    console.log("✨ Platform Superadmin ready. Zero gyms or dummy data exist.");
  } catch (err) {
    console.error("❌ Clean slate failed:", err);
    throw err;
  } finally {
    await db.execute(sql`
      ALTER TABLE IF EXISTS attendance ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS gym_classes ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS memberships ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS members ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS membership_plans ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS tenants ENABLE ROW LEVEL SECURITY;
    `);
    await pool.end();
  }
}

cleanSlate().then(() => {
  console.log("🎉 Clean slate completed successfully!");
  process.exit(0);
}).catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
