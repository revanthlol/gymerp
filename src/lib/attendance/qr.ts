import crypto from "crypto";
import QRCode from "qrcode";

const WINDOW_DURATION_MS = 2 * 60 * 60 * 1000; // 2 Hours
const QR_SECRET = process.env.QR_ROTATION_SECRET || "grym-attendance-rotation-salt-2026";

export interface RotatingQrData {
  tokenString: string;
  qrDataUrl: string;
  windowIndex: number;
  expiresAt: number; // Unix ms
  remainingSeconds: number;
}

/**
 * Generates an anti-proxy rotating QR code for a gym tenant.
 * Rotates strictly every 2 hours to prevent screenshot proxy attendance.
 */
export async function generateGymRotatingQr(tenantId: string): Promise<RotatingQrData> {
  const now = Date.now();
  const windowIndex = Math.floor(now / WINDOW_DURATION_MS);
  const expiresAt = (windowIndex + 1) * WINDOW_DURATION_MS;
  const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

  const signature = crypto
    .createHmac("sha256", QR_SECRET)
    .update(`${tenantId}:${windowIndex}`)
    .digest("hex")
    .slice(0, 16);

  const tokenString = `grym:v1:${tenantId}:${windowIndex}:${signature}`;

  // Generate high-contrast, clean data URL
  const qrDataUrl = await QRCode.toDataURL(tokenString, {
    width: 380,
    margin: 1.5,
    color: {
      dark: "#080809",
      light: "#76b900",
    },
    errorCorrectionLevel: "M",
  });

  return {
    tokenString,
    qrDataUrl,
    windowIndex,
    expiresAt,
    remainingSeconds,
  };
}

/**
 * Validates a scanned QR token against the gym's current and previous 2-hour window.
 */
export function verifyGymRotatingQr(tenantId: string, tokenString: string): {
  valid: boolean;
  reason?: string;
} {
  if (!tokenString || !tokenString.startsWith("grym:v1:")) {
    return { valid: false, reason: "Invalid turnstile QR format" };
  }

  const parts = tokenString.split(":");
  if (parts.length !== 5) {
    return { valid: false, reason: "Malformed attendance token" };
  }

  const [, , tokenTenantId, windowStr, tokenSignature] = parts;
  if (tokenTenantId !== tenantId) {
    return { valid: false, reason: "Token belongs to a different gym location" };
  }

  const parsedWindow = parseInt(windowStr, 10);
  const now = Date.now();
  const currentWindow = Math.floor(now / WINDOW_DURATION_MS);

  // Accept current window or previous window within 5 minutes of boundary
  const isCurrent = parsedWindow === currentWindow;
  const isGracePrevious =
    parsedWindow === currentWindow - 1 &&
    now - parsedWindow * WINDOW_DURATION_MS < 5 * 60 * 1000;

  if (!isCurrent && !isGracePrevious) {
    return { valid: false, reason: "Turnstile QR code has expired (2-hour limit reached)" };
  }

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac("sha256", QR_SECRET)
    .update(`${tenantId}:${parsedWindow}`)
    .digest("hex")
    .slice(0, 16);

  if (tokenSignature !== expectedSignature) {
    return { valid: false, reason: "Invalid signature verification" };
  }

  return { valid: true };
}
