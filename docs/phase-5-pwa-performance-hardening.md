# Phase 5 — PWA Kiosk Hardening, Performance & Security Audit

> **Scope:**
> Final production hardening: lock down shared kiosk security on front-desk tablets, guarantee offline attendance capture via IndexedDB, enforce rigorous Core Web Vitals benchmarks across all role portals, apply HTTP security headers, and verify zero-leak session termination.

---

## 1. Shared Kiosk Security & Session Teardown

Gym front desks frequently run on shared hardware (iPad or Android tablet) used by multiple staff shifts. When staff logs out, **zero residual member PII or cached session tokens** must remain in browser memory.

### 1.1 Centralized Session Eraser (`src/lib/auth/cleanup.ts`)
```typescript
/**
 * Completely purges all client credentials, cached state, and transient offline stores.
 * Invoked on every explicit logout or when a session expiry event is caught.
 */
export async function clearSessionArtifacts(): Promise<void> {
  // 1. Terminate server session cookie via route handler
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (err) {
    console.warn("Server session teardown failed; proceeding with client purge", err);
  }

  // 2. Clear LocalStorage and SessionStorage
  if (typeof window !== "undefined") {
    localStorage.clear();
    sessionStorage.clear();

    // 3. Clear Service Worker Cache Storage (except static app shell)
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => !name.startsWith("serwist-precache"))
          .map((name) => caches.delete(name))
      );
    }

    // 4. Redirect to login with cache busting
    window.location.href = "/login?logged_out=1";
  }
}
```

---

## 2. Kiosk Offline Attendance Queue (`src/lib/kiosk/offline-queue.ts`)

Implements a durable browser-local queue using native IndexedDB so check-ins during gym Wi-Fi dropouts are never lost:

```typescript
const DB_NAME = "gymerp_kiosk_db";
const STORE_NAME = "pending_scans";

interface QueuedScan {
  id?: number;
  qrToken: string;
  scannedAt: string;
  status: "queued" | "syncing" | "failed";
}

function openKioskDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueCheckin(qrToken: string): Promise<void> {
  const db = await openKioskDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const scan: QueuedScan = {
      qrToken,
      scannedAt: new Date().toISOString(),
      status: "queued",
    };
    const req = store.add(scan);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function flushKioskQueue(
  processFn: (token: string) => Promise<any>
): Promise<number> {
  const db = await openKioskDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve) => {
    const getAllReq = store.getAll();
    getAllReq.onsuccess = async () => {
      const scans: QueuedScan[] = getAllReq.result;
      let flushedCount = 0;

      for (const scan of scans) {
        try {
          await processFn(scan.qrToken);
          if (scan.id) {
            store.delete(scan.id);
            flushedCount++;
          }
        } catch (err) {
          console.error("Failed to sync queued scan:", scan, err);
          break; // Stop flushing if connection is still failing
        }
      }
      resolve(flushedCount);
    };
  });
}
```

---

## 3. Performance Pass & Core Web Vitals

### 3.1 Performance Budget

| Metric | Target | Optimization Strategy |
|---|---|---|
| **LCP (Largest Contentful Paint)** | `< 1.8s` | Server Components stream data tables with Suspense skeletons; no client waterfalls |
| **INP (Interaction to Next Paint)** | `< 150ms` | Form mutations executed via optimistic UI in Server Actions |
| **CLS (Cumulative Layout Shift)** | `< 0.05` | Explicit image sizing, font fallback metrics configured in `next/font` |
| **First Load JS Bundle** | `< 90 kB` | Dynamic imports for `html5-qrcode`, `qrcode.react`, and chart components |

### 3.2 Dynamic Import for Heavy Scanner Component
```typescript
import dynamic from "next/dynamic";

export const KioskCameraScanner = dynamic(
  () => import("@/components/kiosk/camera-scanner").then((mod) => mod.CameraScanner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-square bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 animate-pulse">
        Initializing Scanner Camera...
      </div>
    ),
  }
);
```

---

## 4. Production Security Headers (`next.config.mjs`)

```javascript
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
];

export default {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 5. Web App Manifest (`public/manifest.json`)

```json
{
  "name": "GymERP — Fitness Management System",
  "short_name": "GymERP",
  "description": "Multi-tenant ERP platform for modern gym and fitness operations.",
  "start_url": "/staff/kiosk",
  "display": "standalone",
  "background_color": "#080809",
  "theme_color": "#09090b",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

---

## 6. Phase 5 Exit Criteria & Final Production Audit

- [ ] DevTools Application tab verifies that Serwist caches only static assets (`.js`, `.css`, `.woff2`, `.svg`); zero API/database responses exist in Cache Storage.
- [ ] Invoking `clearSessionArtifacts()` on logout purges all cookies, storage, and dynamic cache entries.
- [ ] Front-desk kiosk survives simulated offline mode: scans queue in IndexedDB and flush automatically when back online.
- [ ] Lighthouse Performance score is `>= 95` on `/admin`, `/staff`, and `/platform`.
- [ ] Camera permissions policy enables scanner strictly on HTTPS / localhost.
- [ ] Security headers pass securityheaders.com grade `A`.
