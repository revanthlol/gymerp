import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kiosks, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  subscribeKioskEvents,
  getRecentKioskEvents,
  KioskScanEvent,
} from "@/lib/kiosk/kiosk-events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const isPoll = req.nextUrl.searchParams.get("poll") === "true";
  const sinceStr = req.nextUrl.searchParams.get("since");
  const since = sinceStr ? parseInt(sinceStr, 10) : undefined;

  if (!token) {
    return NextResponse.json({ error: "Missing kiosk secret token" }, { status: 400 });
  }

  // 1. Verify kiosk secret token in database
  const [kiosk] = await db
    .select({
      id: kiosks.id,
      name: kiosks.name,
      mode: kiosks.mode,
      isActive: kiosks.isActive,
      tenantId: kiosks.tenantId,
    })
    .from(kiosks)
    .where(eq(kiosks.secretToken, token))
    .limit(1);

  if (!kiosk || kiosk.isActive !== "true") {
    return NextResponse.json({ error: "Kiosk terminal not found or deactivated" }, { status: 401 });
  }

  // 2. Record heartbeat in background (fire and forget)
  db.update(kiosks)
    .set({ lastHeartbeatAt: new Date() })
    .where(eq(kiosks.id, kiosk.id))
    .catch(() => {});

  // 3. Polling mode fallback
  if (isPoll) {
    const events = getRecentKioskEvents({
      kioskToken: token,
      tenantId: kiosk.tenantId,
      since,
    });
    return NextResponse.json({
      success: true,
      kiosk: {
        id: kiosk.id,
        name: kiosk.name,
        mode: kiosk.mode,
      },
      events,
    });
  }

  // 4. Server-Sent Events (SSE) streaming mode
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial welcome/connected payload
      const initialMessage = `event: connected\ndata: ${JSON.stringify({
        kioskId: kiosk.id,
        name: kiosk.name,
        mode: kiosk.mode,
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initialMessage));

      // Subscribe to live scan events
      const unsubscribe = subscribeKioskEvents(
        { kioskToken: token, tenantId: kiosk.tenantId },
        (event: KioskScanEvent) => {
          try {
            const data = `event: scan\ndata: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch {
            // controller closed
          }
        }
      );

      // Keepalive heartbeat ping every 15 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      // Clean up on client disconnect / tab close
      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body.token;
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const [kiosk] = await db
      .select({ id: kiosks.id })
      .from(kiosks)
      .where(eq(kiosks.secretToken, token))
      .limit(1);

    if (!kiosk) {
      return NextResponse.json({ error: "Kiosk not found" }, { status: 404 });
    }

    await db
      .update(kiosks)
      .set({ lastHeartbeatAt: new Date() })
      .where(eq(kiosks.id, kiosk.id));

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
