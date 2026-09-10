import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "connected";
  let dbLatencyMs = 0;

  try {
    const client = await pool.connect();
    await client.query("SELECT 1;");
    client.release();
    dbLatencyMs = Date.now() - startTime;
  } catch (err: any) {
    dbStatus = `error: ${err?.message || "unknown"}`;
  }

  const isHealthy = dbStatus === "connected";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      service: "gymerp-web",
      region: process.env.VERCEL_REGION || "local",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        pingLatencyMs: dbLatencyMs,
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
