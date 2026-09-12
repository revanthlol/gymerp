import fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { pool } from "@/lib/db";
import { authRoutes } from "./routes/auth";
import { attendanceRoutes } from "./routes/attendance";
import { memberRoutes } from "./routes/members";
import { tenantRoutes } from "./routes/tenants";
import { dashboardRoutes } from "./routes/dashboard";
import { paymentRoutes } from "./routes/payments";
import { classRoutes } from "./routes/classes";
import { planRoutes } from "./routes/plans";
import { kioskRoutes } from "./routes/kiosk";
import { onboardingRoutes } from "./routes/onboarding";

const app = fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
  trustProxy: true,
});

async function startServer() {
  try {
    // 1. Register Core Plugins
    await app.register(cors, {
      origin: [
        process.env.APP_URL || "http://localhost:3000",
        "https://gymerp-liard.vercel.app",
        "https://gymerp-ocus-projects.vercel.app",
        /\.vercel\.app$/,
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    });

    await app.register(cookie, {
      secret: process.env.COOKIE_SECRET || "gym-erp-node-backend-secret-super-secure",
      parseOptions: {},
    });

    // 2. Health & Performance Check
    app.get("/health", async (_request, reply) => {
      const startTime = Date.now();
      let dbStatus = "connected";
      let dbLatencyMs = 0;

      try {
        const client = await pool.connect();
        await client.query("SELECT 1;");
        client.release();
        dbLatencyMs = Date.now() - startTime;
      } catch (err: any) {
        dbStatus = `error: ${err.message}`;
      }

      return reply.send({
        status: dbStatus === "connected" ? "healthy" : "degraded",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: {
          status: dbStatus,
          pingLatencyMs: dbLatencyMs,
          totalConnections: pool.totalCount,
          idleConnections: pool.idleCount,
          waitingConnections: pool.waitingCount,
        },
        memoryUsageMb: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        },
      });
    });

    // 3. Mount API Routes
    await app.register(authRoutes, { prefix: "/api/auth" });
    await app.register(attendanceRoutes, { prefix: "/api/attendance" });
    await app.register(memberRoutes, { prefix: "/api/members" });
    await app.register(tenantRoutes, { prefix: "/api/tenants" });
    await app.register(dashboardRoutes, { prefix: "/api/dashboard" });
    await app.register(paymentRoutes, { prefix: "/api/payments" });
    await app.register(classRoutes, { prefix: "/api/classes" });
    await app.register(planRoutes, { prefix: "/api/plans" });
    await app.register(kioskRoutes, { prefix: "/api/kiosk" });
    await app.register(onboardingRoutes, { prefix: "/api/onboarding" });

    // 4. Pre-warm Database Connection Pool
    app.log.info("🔥 Pre-warming PostgreSQL connection pool...");
    const client = await pool.connect();
    await client.query("SELECT 1;");
    client.release();
    app.log.info("⚡ PostgreSQL connection pool warm & ready!");

    // 5. Start listening
    const port = parseInt(process.env.PORT || "4000", 10);
    const host = process.env.HOST || "0.0.0.0";

    await app.listen({ port, host });
    app.log.info(`🚀 GymERP High-Performance Node Backend listening on http://${host}:${port}`);
    app.log.info(`📊 Health check active at http://${host}:${port}/health`);
  } catch (err) {
    app.log.error(err, "Fatal error during server startup");
    process.exit(1);
  }
}

// Handle Graceful Shutdown
const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
signals.forEach((signal) => {
  process.on(signal, async () => {
    app.log.info(`Received ${signal}. Gracefully terminating GymERP backend server...`);
    try {
      await app.close();
      await pool.end();
      app.log.info("All connections cleanly closed. Goodbye!");
      process.exit(0);
    } catch (err) {
      app.log.error(err, "Error during graceful shutdown");
      process.exit(1);
    }
  });
});

startServer();
