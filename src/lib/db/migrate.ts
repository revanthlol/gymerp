import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { pool } from "./index";
import * as fs from "fs";
import * as path from "path";

async function runMigrate() {
  console.log("⚡ Running Drizzle migrations...");
  const db = drizzle(pool);
  try {
    await migrate(db, { migrationsFolder: "./drizzle/migrations" });
    console.log("✅ Core schema migrations completed!");

    // Apply PostgreSQL Row-Level Security policies
    const rlsFile = path.resolve("./drizzle/migrations/0001_enable_rls.sql");
    if (fs.existsSync(rlsFile)) {
      console.log("🔒 Applying PostgreSQL Row-Level Security (RLS) policies...");
      const rlsSql = fs.readFileSync(rlsFile, "utf8");
      await pool.query(rlsSql);
      console.log("✅ RLS policies applied and forced!");
    }
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrate();
