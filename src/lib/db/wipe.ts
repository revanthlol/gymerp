import { db, pool } from "./index";
import { sql } from "drizzle-orm";
import { tenants, users } from "./schema";
import { adminAuth } from "../firebase/admin";

async function getOrCreatePlatformUser(): Promise<string> {
  const email = "platform@gymerp.local";
  const password = "Admin12345!";
  const displayName = "Platform Superadmin";

  let uid: string;
  try {
    const existing = await adminAuth.getUserByEmail(email);
    uid = existing.uid;
    await adminAuth.updateUser(uid, { password, displayName });
    console.log(`✓ Synchronized existing Firebase user: ${email} (${uid})`);
  } catch (err: any) {
    if (err.code === "auth/user-not-found") {
      const created = await adminAuth.createUser({
        email,
        password,
        displayName,
      });
      uid = created.uid;
      console.log(`✓ Created Firebase user: ${email} (${uid})`);
    } else {
      console.warn("⚠️ Firebase Admin warning:", err.message);
      uid = "uid_mock_platform_superadmin";
    }
  }

  try {
    await adminAuth.setCustomUserClaims(uid, {
      role: "platform",
      tenant_id: null,
    });
    console.log(`✓ Set platform custom claims for: ${email}`);
  } catch (err: any) {
    console.warn("⚠️ Failed to set custom claims in Firebase:", err.message);
  }

  return uid;
}

async function wipeDatabase() {
  console.log("🧹 Starting complete database wipe (Zero Dummy Data)...");

  // Disable RLS temporarily to perform administrative wipe
  await db.execute(sql`
    ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
    ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
    ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
    ALTER TABLE members DISABLE ROW LEVEL SECURITY;
    ALTER TABLE membership_plans DISABLE ROW LEVEL SECURITY;
    ALTER TABLE gym_classes DISABLE ROW LEVEL SECURITY;
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
    ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
  `);

  try {
    // 1. Truncate all transactional and tenant-owned tables
    console.log("Truncating attendance, payments, memberships, members, classes, plans...");
    await db.execute(
      sql`TRUNCATE TABLE attendance, payments, memberships, members, gym_classes, membership_plans CASCADE;`
    );

    // 2. Clear all users and tenants
    console.log("Truncating users and tenants...");
    await db.execute(
      sql`TRUNCATE TABLE users, tenants CASCADE;`
    );

    // 3. Provision clean Platform Superadmin
    console.log("Ensuring Platform Superadmin exists...");
    const platformUid = await getOrCreatePlatformUser();

    const [platformUser] = await db
      .insert(users)
      .values({
        firebaseUid: platformUid,
        role: "platform",
        email: "platform@gymerp.local",
        fullName: "Platform Superadmin",
        tenantId: null,
      })
      .returning();

    console.log(`\n=======================================================`);
    console.log(`✅ DATABASE FULLY WIPED & CLEAN!`);
    console.log(`- Members: 0`);
    console.log(`- Attendance: 0`);
    console.log(`- Payments: 0`);
    console.log(`- Subscriptions: 0`);
    console.log(`- Classes: 0`);
    console.log(`- Plans: 0`);
    console.log(`- Tenants: 0 (Ready for manual creation in Platform Console)`);
    console.log(`- Platform Superadmin: ${platformUser.email} (Password: Admin12345!)`);
    console.log(`=======================================================\n`);
  } finally {
    // Re-enable and force RLS across all tables
    await db.execute(sql`
      ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
      ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
      ALTER TABLE members ENABLE ROW LEVEL SECURITY;
      ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
      ALTER TABLE gym_classes ENABLE ROW LEVEL SECURITY;
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

      ALTER TABLE attendance FORCE ROW LEVEL SECURITY;
      ALTER TABLE payments FORCE ROW LEVEL SECURITY;
      ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
      ALTER TABLE members FORCE ROW LEVEL SECURITY;
      ALTER TABLE membership_plans FORCE ROW LEVEL SECURITY;
      ALTER TABLE gym_classes FORCE ROW LEVEL SECURITY;
      ALTER TABLE users FORCE ROW LEVEL SECURITY;
      ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
    `);
  }
}

wipeDatabase()
  .catch((err) => {
    console.error("❌ Wipe failed:", err);
    process.exit(1);
  })
  .finally(() => pool.end());
