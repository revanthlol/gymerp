export type UserRole = "platform" | "admin" | "staff";

export interface CustomClaims {
  role: UserRole;
  tenant_id: string | null;
}

export interface SessionUser {
  uid: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  displayName?: string;
  photoURL?: string;
}

export interface SessionData {
  user: SessionUser;
  expiresAt: number;
}
