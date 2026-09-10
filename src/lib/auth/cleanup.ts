/**
 * Shared Kiosk & Tablet Session Purge
 * Completely erases all auth cookies, client credentials, local storage,
 * and service worker caches to prevent data leakage across shift workers.
 */

export async function clearSessionArtifacts(): Promise<void> {
  // 1. Terminate server-side session cookie via route handler
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.warn("[Auth] Server session termination error (continuing client purge):", err);
  }

  // 2. Erase all browser client storage
  if (typeof window !== "undefined") {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore private browsing storage restrictions
    }

    // 3. Clear Service Worker caches (preserve static app shell)
    if ("caches" in window) {
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys
            .filter((key) => !key.startsWith("gymerp-shell"))
            .map((key) => caches.delete(key))
        );
      } catch (err) {
        console.warn("[Auth] Cache clearance error:", err);
      }
    }

    // 4. Force browser redirect with cache buster
    window.location.href = "/login?logged_out=1";
  }
}
