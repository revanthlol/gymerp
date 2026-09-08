import { pool } from "./index";

async function testRls() {
  console.log("🔒 Starting PostgreSQL Row-Level Security (RLS) Verification...");

  const client = await pool.connect();
  let passedCount = 0;
  let failedCount = 0;

  try {
    // 1. Fetch Tenant IDs under platform context within a transaction
    await client.query("BEGIN;");
    await client.query("SELECT set_config('app.current_role', 'platform', true);");
    const tenantsRes = await client.query(`SELECT id, name FROM tenants ORDER BY name ASC;`);
    await client.query("COMMIT;");

    const tenant1 = tenantsRes.rows.find((t: any) => t.name === "Iron Pulse Fitness");
    const tenant2 = tenantsRes.rows.find((t: any) => t.name === "Apex Combat Club");

    if (!tenant1 || !tenant2) {
      throw new Error("Missing test tenants in database. Run pnpm db:seed first.");
    }

    // -------------------------------------------------------------------------
    // TEST 1: Platform Superadmin Privacy Boundary
    // Hard Rule: Platform role MUST have ZERO access to members table
    // -------------------------------------------------------------------------
    console.log("\n[TEST 1] Verifying Platform role cannot query members table...");
    await client.query("BEGIN;");
    await client.query("SELECT set_config('app.current_role', 'platform', true);");
    await client.query("SELECT set_config('app.current_tenant_id', '', true);");

    const platformMembers = await client.query("SELECT * FROM members;");
    await client.query("COMMIT;");

    if (platformMembers.rows.length === 0) {
      console.log("  ✅ PASS: Platform role received 0 rows from members table.");
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: Platform role leaked ${platformMembers.rows.length} member rows!`);
      failedCount++;
    }

    // -------------------------------------------------------------------------
    // TEST 2: Platform Superadmin Tenants Management
    // Rule: Platform role CAN manage all tenants
    // -------------------------------------------------------------------------
    console.log("\n[TEST 2] Verifying Platform role can select all tenants...");
    await client.query("BEGIN;");
    await client.query("SELECT set_config('app.current_role', 'platform', true);");
    const platformTenants = await client.query("SELECT * FROM tenants;");
    await client.query("COMMIT;");

    if (platformTenants.rows.length >= 2) {
      console.log(`  ✅ PASS: Platform role sees all ${platformTenants.rows.length} tenants.`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: Platform role could not query tenants.`);
      failedCount++;
    }

    // -------------------------------------------------------------------------
    // TEST 3: Tenant Data Isolation
    // Rule: Admin for Tenant 1 can only see Tenant 1 members (2 members), never Tenant 2 (1 member)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 3] Verifying Tenant 1 Admin cannot see Tenant 2 members...");
    await client.query("BEGIN;");
    await client.query("SELECT set_config('app.current_role', 'admin', true);");
    await client.query(`SELECT set_config('app.current_tenant_id', '${tenant1.id}', true);`);

    const tenant1Members = await client.query("SELECT * FROM members;");
    await client.query("COMMIT;");

    const hasTenant2Member = tenant1Members.rows.some((m: any) => m.tenant_id === tenant2.id);

    if (tenant1Members.rows.length === 2 && !hasTenant2Member) {
      console.log(`  ✅ PASS: Tenant 1 sees exactly ${tenant1Members.rows.length} own members. Zero cross-tenant leaks.`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: Tenant isolation violation! Rows: ${tenant1Members.rows.length}, leaked: ${hasTenant2Member}`);
      failedCount++;
    }

    // -------------------------------------------------------------------------
    // TEST 4: Staff Role Modification Restrictions on Plans
    // Rule: Staff cannot INSERT a new membership plan (Admin only)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 4] Verifying Staff role is blocked from inserting membership plans...");
    let staffBlocked = false;
    await client.query("BEGIN;");
    await client.query("SELECT set_config('app.current_role', 'staff', true);");
    await client.query(`SELECT set_config('app.current_tenant_id', '${tenant1.id}', true);`);

    try {
      await client.query(`
        INSERT INTO membership_plans (tenant_id, name, price, duration_days)
        VALUES ('${tenant1.id}', 'Unauthorized Staff Plan', 10.00, 10);
      `);
      await client.query("COMMIT;");
    } catch (err: any) {
      await client.query("ROLLBACK;");
      staffBlocked = true;
    }

    if (staffBlocked) {
      console.log("  ✅ PASS: RLS blocked staff role from inserting membership plan.");
      passedCount++;
    } else {
      console.error("  ❌ FAIL: Staff role was able to insert a membership plan!");
      failedCount++;
    }

    // -------------------------------------------------------------------------
    // TEST 5: Admin Can Create Plan in Own Tenant
    // -------------------------------------------------------------------------
    console.log("\n[TEST 5] Verifying Admin role can insert membership plan in own tenant...");
    let adminSuccess = false;
    await client.query("BEGIN;");
    await client.query("SELECT set_config('app.current_role', 'admin', true);");
    await client.query(`SELECT set_config('app.current_tenant_id', '${tenant1.id}', true);`);

    try {
      const res = await client.query(`
        INSERT INTO membership_plans (tenant_id, name, price, duration_days)
        VALUES ('${tenant1.id}', 'VIP Day Pass', 15.00, 1)
        RETURNING id;
      `);
      adminSuccess = res.rows.length === 1;
      await client.query("ROLLBACK;"); // rollback so we don't pollute seed
    } catch (err: any) {
      await client.query("ROLLBACK;");
      console.error("Admin insert error:", err.message);
    }

    if (adminSuccess) {
      console.log("  ✅ PASS: Admin role successfully inserted plan in own tenant.");
      passedCount++;
    } else {
      console.error("  ❌ FAIL: Admin role failed to insert plan in own tenant.");
      failedCount++;
    }

    console.log("\n=======================================================");
    console.log(`RLS Verification Summary: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("=======================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

testRls().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
