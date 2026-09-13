import { EventEmitter } from "events";

export interface KioskScanEvent {
  id: string;
  kioskToken?: string;
  tenantId: string;
  type: "scan";
  success: boolean;
  expired?: boolean;
  duplicate?: boolean;
  mode: "entry" | "exit";
  message: string;
  memberName?: string;
  memberCard?: {
    id: string;
    fullName: string;
    status: string;
    expiryDate: string;
    joinDate?: string;
    daysRemaining?: number;
  };
  timestamp: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __gymerp_kiosk_emitter: EventEmitter | undefined;
  // eslint-disable-next-line no-var
  var __gymerp_kiosk_recent_events: KioskScanEvent[] | undefined;
}

const emitter = globalThis.__gymerp_kiosk_emitter || new EventEmitter();
emitter.setMaxListeners(300);
globalThis.__gymerp_kiosk_emitter = emitter;

const recentEvents: KioskScanEvent[] = globalThis.__gymerp_kiosk_recent_events || [];
globalThis.__gymerp_kiosk_recent_events = recentEvents;

/**
 * Broadcast an incoming scan event to all active kiosk station listeners
 */
export function emitKioskScanEvent(event: KioskScanEvent): void {
  recentEvents.unshift(event);
  if (recentEvents.length > 50) {
    recentEvents.pop();
  }

  // Global broadcast
  emitter.emit("kiosk-scan", event);

  // Kiosk-token specific broadcast
  if (event.kioskToken) {
    emitter.emit(`kiosk-scan:${event.kioskToken}`, event);
  }

  // Tenant specific broadcast
  if (event.tenantId) {
    emitter.emit(`kiosk-scan:tenant:${event.tenantId}`, event);
  }
}

/**
 * Subscribe to scan events for a specific kiosk station or tenant
 */
export function subscribeKioskEvents(
  filter: { kioskToken?: string; tenantId?: string },
  callback: (event: KioskScanEvent) => void
): () => void {
  const handler = (event: KioskScanEvent) => {
    if (filter.kioskToken && event.kioskToken && event.kioskToken !== filter.kioskToken) {
      return;
    }
    if (filter.tenantId && event.tenantId && event.tenantId !== filter.tenantId) {
      return;
    }
    callback(event);
  };

  const channel = filter.kioskToken
    ? `kiosk-scan:${filter.kioskToken}`
    : filter.tenantId
    ? `kiosk-scan:tenant:${filter.tenantId}`
    : "kiosk-scan";

  emitter.on(channel, handler);
  return () => {
    emitter.off(channel, handler);
  };
}

/**
 * Retrieve recent events for polling / reconnects
 */
export function getRecentKioskEvents(filter: {
  kioskToken?: string;
  tenantId?: string;
  since?: number;
}): KioskScanEvent[] {
  const cutoff = filter.since || Date.now() - 30000;
  return recentEvents.filter((ev) => {
    if (ev.timestamp < cutoff) return false;
    if (filter.kioskToken && ev.kioskToken && ev.kioskToken !== filter.kioskToken) return false;
    if (filter.tenantId && ev.tenantId && ev.tenantId !== filter.tenantId) return false;
    return true;
  });
}
