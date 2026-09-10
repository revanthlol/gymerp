import { FastifyRequest, FastifyReply } from "fastify";
import { adminAuth } from "@/lib/firebase/admin";
import { UserRole } from "@/types/auth";

export interface SessionPayload {
  uid: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
}

declare module "fastify" {
  interface FastifyRequest {
    sessionUser?: SessionPayload;
  }
}

export async function authenticateSession(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token =
    request.cookies.__session ||
    (request.headers.authorization?.startsWith("Bearer ")
      ? request.headers.authorization.slice(7)
      : undefined);

  if (!token) {
    reply.status(401).send({ error: "Unauthorized: Missing session token or cookie" });
    return;
  }

  try {
    let decoded: any;
    try {
      decoded = await adminAuth.verifySessionCookie(token, false);
    } catch {
      // Fallback: Check if it's an active ID token
      decoded = await adminAuth.verifyIdToken(token);
    }

    request.sessionUser = {
      uid: decoded.uid,
      email: decoded.email || "",
      role: (decoded.role as UserRole) || "staff",
      tenantId: (decoded.tenant_id as string) || null,
    };
  } catch (error: any) {
    reply.status(401).send({
      error: "Unauthorized: Invalid or expired session token",
      details: error?.message,
    });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.sessionUser) {
      reply.status(401).send({ error: "Unauthorized: Authentication required" });
      return;
    }

    if (!allowedRoles.includes(request.sessionUser.role)) {
      reply.status(403).send({
        error: `Forbidden: Required role [${allowedRoles.join(", ")}], current role is '${request.sessionUser.role}'`,
      });
      return;
    }

    // Ensure tenant-scoped roles have a tenantId
    if (request.sessionUser.role !== "platform" && !request.sessionUser.tenantId) {
      reply.status(403).send({
        error: "Forbidden: Missing tenant context for tenant-scoped user",
      });
      return;
    }
  };
}
