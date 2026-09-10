import { FastifyPluginAsync } from "fastify";
import { adminAuth } from "@/lib/firebase/admin";
import { authenticateSession } from "../middleware/auth";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Create session cookie from client-side Firebase ID token
  fastify.post<{ Body: { idToken: string } }>("/session", async (request, reply) => {
    const { idToken } = request.body || {};

    if (!idToken) {
      return reply.status(400).send({ error: "ID token is required" });
    }

    try {
      // 5-day session duration
      const expiresIn = 60 * 60 * 24 * 5 * 1000;
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      const decoded = await adminAuth.verifySessionCookie(sessionCookie);

      reply.setCookie("__session", sessionCookie, {
        maxAge: expiresIn / 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
      });

      return reply.send({
        status: "success",
        user: {
          uid: decoded.uid,
          email: decoded.email,
          role: decoded.role || "staff",
          tenantId: decoded.tenant_id || null,
        },
      });
    } catch (error: any) {
      request.log.error(error, "Failed to create session cookie");
      return reply.status(401).send({
        error: "Failed to create session cookie: " + (error?.message || "Unknown error"),
      });
    }
  });

  // Clear session cookie
  fastify.post("/logout", async (_request, reply) => {
    reply.clearCookie("__session", { path: "/" });
    return reply.send({ status: "success", message: "Logged out successfully" });
  });

  // Get current user session profile
  fastify.get("/me", { preHandler: [authenticateSession] }, async (request, reply) => {
    return reply.send({ user: request.sessionUser });
  });
};
