import { pool } from "../src/lib/db";

async function main() {
  const client = await pool.connect();
  try {
    console.log("Applying targeted schema update...");

    // 1. Add notes to members
    await client.query(`
      ALTER TABLE members ADD COLUMN IF NOT EXISTS notes text;
    `);
    console.log("✅ Added notes column to members table");

    // 2. Create gym_classes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gym_classes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name text NOT NULL,
        trainer text NOT NULL,
        time text NOT NULL,
        duration_minutes integer DEFAULT 60 NOT NULL,
        day_of_week text DEFAULT 'Daily' NOT NULL,
        location text DEFAULT 'Main Studio' NOT NULL,
        capacity integer DEFAULT 20 NOT NULL,
        booked_count integer DEFAULT 0 NOT NULL,
        category text DEFAULT 'Strength' NOT NULL,
        is_active text DEFAULT 'true' NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    console.log("✅ Created gym_classes table");

    // 3. Index on tenant_id
    await client.query(`
      CREATE INDEX IF NOT EXISTS gym_classes_tenant_idx ON gym_classes(tenant_id);
    `);
    console.log("✅ Created index on gym_classes(tenant_id)");

    // 4. Enable RLS and add tenant isolation policy
    await client.query(`
      ALTER TABLE gym_classes ENABLE ROW LEVEL SECURITY;
      
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'gym_classes' AND policyname = 'gym_classes_tenant_isolation'
        ) THEN
          CREATE POLICY gym_classes_tenant_isolation ON gym_classes
            FOR ALL
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
        END IF;
      END
      $$;
    `);
    console.log("✅ Configured RLS policy for gym_classes");

    // 5. Populate initial classes for existing tenants if empty
    const { rows: tenantsList } = await client.query(`SELECT id, name FROM tenants LIMIT 5;`);
    for (const t of tenantsList) {
      const { rows: existingClasses } = await client.query(
        `SELECT id FROM gym_classes WHERE tenant_id = $1 LIMIT 1;`,
        [t.id]
      );

      if (existingClasses.length === 0) {
        console.log(`Seeding initial classes for tenant: ${t.name}...`);
        await client.query(
          `
          INSERT INTO gym_classes (tenant_id, name, trainer, time, duration_minutes, day_of_week, location, capacity, booked_count, category)
          VALUES 
            ($1, 'Morning Functional HIIT', 'Coach Marcus Vance', '07:00 AM', 45, 'Daily', 'Studio 1 (Turf)', 20, 14, 'Cardio'),
            ($1, 'Olympic Lifting & Deadlift Barbell', 'Coach Elena Rostova', '10:00 AM', 60, 'Mon, Wed, Fri', 'Main Weight Room', 12, 9, 'Strength'),
            ($1, 'Power Vinyasa Yoga Flow', 'Coach Priya Patel', '04:30 PM', 50, 'Tue, Thu, Sat', 'Zen Studio B', 18, 12, 'Mind & Body'),
            ($1, 'Boxing Technique & Heavy Bags', 'Coach Devon Miles', '06:30 PM', 60, 'Daily', 'Combat Ring 1', 15, 15, 'Combat'),
            ($1, 'Kettlebell Conditioning & Core', 'Coach Marcus Vance', '08:00 PM', 45, 'Mon, Wed, Fri', 'Studio 2', 16, 8, 'Strength');
          `,
          [t.id]
        );
        console.log(`✅ Seeded 5 classes for tenant: ${t.name}`);
      }
    }

    console.log("🎉 All targeted database updates completed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
