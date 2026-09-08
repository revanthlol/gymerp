"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { SessionUser, UserRole } from "@/types/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
  firebaseUser: User | null;
  sessionUser: SessionUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  sessionUser: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: SessionUser | null;
}) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(initialUser);
  const [loading, setLoading] = useState<boolean>(!initialUser);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          setSessionUser({
            uid: user.uid,
            email: user.email || "",
            role: (tokenResult.claims.role as UserRole) || "staff",
            tenantId: (tokenResult.claims.tenant_id as string) || null,
            displayName: user.displayName || undefined,
            photoURL: user.photoURL || undefined,
          });
        } catch {
          // fallback
        }
      } else {
        setSessionUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await fbSignOut(auth);
    setSessionUser(null);
    setFirebaseUser(null);
    router.push("/login");
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, sessionUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
