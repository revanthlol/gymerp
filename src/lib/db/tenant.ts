import { db } from "./index";
import { sql } from "drizzle-orm";

export interface SessionContext {
  uid?: string;
  userId?: string;
  role: "platform" | "admin" | "staff";
  tenantId: string | null;
}

/**
 * Executes a callback inside a PostgreSQL transaction with tenant-scoped session variables.
 * Enforces PostgreSQL Row-Level Security (RLS) defense-in-depth:
 * - Platform role: app.current_role = 'platform', app.current_tenant_id = ''
 * - Admin/Staff role: app.current_role = 'admin'|'staff', app.current_tenant_id = <uuid>
 */
export async function withTenantDb<T>(
  context: SessionContext | null | undefined,
  operation: (tx: any) => Promise<T>
): Promise<T> {
  if (!context || !context.role) {
    throw new Error("Unauthorized: Active session context required for database operations");
  }

  return await db.transaction(async (tx) => {
    if (context.role === "platform") {
      await tx.execute(
        sql`SELECT set_config('app.current_role', 'platform', true), set_config('app.current_tenant_id', '', true)`
      );
    } else {
      if (!context.tenantId) {
        throw new Error("Tenant ID required for non-platform operations");
      }
      await tx.execute(
        sql`SELECT set_config('app.current_role', ${context.role}, true), set_config('app.current_tenant_id', ${context.tenantId}, true)`
      );
    }
    return await operation(tx);
  });
}
