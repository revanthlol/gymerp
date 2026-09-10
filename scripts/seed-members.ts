import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN;");
    await client.query("SELECT set_config('app.current_role', 'platform', true);");

    const tenantId = "48316cba-286e-45bc-8b4c-9f755d2033f7"; // Iron Pulse Fitness
    const annualPlanId = "267bce13-a47f-4a88-b793-de1e7e3ef1a7";
    const monthlyPlanId = "f094e026-0440-4821-8848-097dd4113225";

    // Check if members already exist
    const check = await client.query("SELECT count(*) FROM members WHERE tenant_id = $1;", [tenantId]);
    if (parseInt(check.rows[0].count, 10) > 0) {
      console.log("Members already exist for Iron Pulse Fitness.");
      await client.query("COMMIT;");
      return;
    }

    console.log("Seeding members for Iron Pulse Fitness...");

    const membersData = [
      {
        fullName: "Marcus Vance",
        phone: "+1 (555) 234-5678",
        email: "marcus.v@example.com",
        gender: "male",
        status: "active",
        planId: annualPlanId,
        amount: "399.00",
      },
      {
        fullName: "Elena Rostova",
        phone: "+1 (555) 876-5432",
        email: "elena.r@example.com",
        gender: "female",
        status: "active",
        planId: monthlyPlanId,
        amount: "49.00",
      },
      {
        fullName: "Liam Chen",
        phone: "+1 (555) 345-6789",
        email: "liam.c@example.com",
        gender: "male",
        status: "active",
        planId: monthlyPlanId,
        amount: "49.00",
      },
      {
        fullName: "Sarah Connor",
        phone: "+1 (555) 987-6543",
        email: "sarah.c@example.com",
        gender: "female",
        status: "frozen",
        planId: annualPlanId,
        amount: "399.00",
      },
      {
        fullName: "Devon Miles",
        phone: "+1 (555) 456-7890",
        email: "devon.m@example.com",
        gender: "male",
        status: "expired",
        planId: monthlyPlanId,
        amount: "49.00",
      },
    ];

    for (const m of membersData) {
      const res = await client.query(
        `INSERT INTO members (tenant_id, full_name, phone, email, gender, status, join_date)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE - INTERVAL '60 days')
         RETURNING id, qr_token;`,
        [tenantId, m.fullName, m.phone, m.email, m.gender, m.status]
      );
      const memberId = res.rows[0].id;

      // Add membership
      const membershipRes = await client.query(
        `INSERT INTO memberships (tenant_id, member_id, plan_id, start_date, end_date, status)
         VALUES ($1, $2, $3, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '45 days', $4)
         RETURNING id;`,
        [tenantId, memberId, m.planId, m.status === "expired" ? "expired" : "active"]
      );
      const membershipId = membershipRes.rows[0].id;

      // Add payment record
      await client.query(
        `INSERT INTO payments (tenant_id, member_id, membership_id, amount, method, status, notes, paid_at)
         VALUES ($1, $2, $3, $4, 'manual', 'paid', 'Front-desk cash intake', NOW() - INTERVAL '15 days');`,
        [tenantId, memberId, membershipId, m.amount]
      );

      // Add attendance logs
      const checkinCount = m.status === "active" ? 6 : 2;
      for (let i = 1; i <= checkinCount; i++) {
        await client.query(
          `INSERT INTO attendance (tenant_id, member_id, checked_in_at, method, kiosk_id)
           VALUES ($1, $2, NOW() - INTERVAL '${i * 2} days', 'qr', 'front-kiosk-01');`,
          [tenantId, memberId]
        );
      }
    }

    await client.query("COMMIT;");
    console.log("Successfully seeded 5 members with memberships, attendance and payments!");
  } catch (e) {
    await client.query("ROLLBACK;");
    console.error("Seeding error:", e);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
