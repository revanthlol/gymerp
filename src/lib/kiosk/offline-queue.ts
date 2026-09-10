/**
 * IndexedDB Durable Offline Queue for Turnstile & Kiosk Check-Ins
 * Guarantees zero lost attendance data during front-desk Wi-Fi dropouts.
 */

const DB_NAME = "gymerp_kiosk_db";
const DB_VERSION = 1;
const STORE_NAME = "pending_scans";

export interface QueuedAttendance {
  id?: number;
  memberId: string;
  memberName: string;
  method: "qr_scan" | "manual";
  qrToken?: string;
  timestamp: string;
  status: "queued" | "syncing" | "failed";
}

function openKioskDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB not available in current environment"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueOfflineCheckIn(
  scan: Omit<QueuedAttendance, "id" | "status">
): Promise<number> {
  const db = await openKioskDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const record: QueuedAttendance = {
      ...scan,
      status: "queued",
    };

    const addReq = store.add(record);
    addReq.onsuccess = () => resolve(addReq.result as number);
    addReq.onerror = () => reject(addReq.error);
  });
}

export async function getPendingQueueCount(): Promise<number> {
  try {
    const db = await openKioskDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const countReq = store.count();

      countReq.onsuccess = () => resolve(countReq.result);
      countReq.onerror = () => reject(countReq.error);
    });
  } catch {
    return 0;
  }
}

export async function getPendingQueue(): Promise<QueuedAttendance[]> {
  try {
    const db = await openKioskDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.getAll();

      getReq.onsuccess = () => resolve(getReq.result || []);
      getReq.onerror = () => reject(getReq.error);
    });
  } catch {
    return [];
  }
}

export async function flushKioskQueue(
  processFn: (scan: QueuedAttendance) => Promise<{ success: boolean }>
): Promise<{ synced: number; failed: number }> {
  const db = await openKioskDb();
  const queue = await getPendingQueue();

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const res = await processFn(item);
      if (res.success) {
        // Remove from IDB
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          const delReq = store.delete(item.id!);
          delReq.onsuccess = () => resolve();
          delReq.onerror = () => reject(delReq.error);
        });
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
