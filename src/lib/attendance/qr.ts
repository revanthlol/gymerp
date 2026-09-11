import crypto from "crypto";
import QRCode from "qrcode";

const QR_SECRET = process.env.QR_ROTATION_SECRET || "gymerp-attendance-single-use-salt-2026";
const TOKEN_TTL_SECONDS = 20; // 20-second fast dynamic rotation for anti-proxy security

export type KioskMode = "entry" | "exit" | "auto";

export interface UniqueQrData {
  nonce: string;
  tokenString: string;
  qrDataUrl: string;
  scanUrl: string;
  mode: KioskMode;
  expiresAt: number; // Unix ms
  remainingSeconds: number;
}

/**
 * Generates a single-use dynamic QR code unique to each scan session.
 * Encodes a direct URL for instant smartphone camera scanning as well as raw cryptographic token.
 * Automatically rotates immediately upon each check-in scan or after 20s expiry.
 */
export async function generateGymRotatingQr(
  tenantId: string,
  mode: KioskMode = "entry"
): Promise<UniqueQrData> {
  const nonce = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + TOKEN_TTL_SECONDS * 1000;

  // Cryptographic HMAC signature guaranteeing origin & authenticity
  const signature = crypto
    .createHmac("sha256", QR_SECRET)
    .update(`${tenantId}:${mode}:${nonce}:${expiresAt}`)
    .digest("hex")
    .slice(0, 20);

  const tokenString = `gymerp:v3:${tenantId}:${mode}:${nonce}:${expiresAt}:${signature}`;

  // Direct phone camera scan URL
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "https://gymerp-liard.vercel.app");
  
  const scanUrl = `${baseUrl}/portal/scan?token=${encodeURIComponent(tokenString)}&mode=${mode}`;

  // High-contrast clean QR for instant camera & scanner detection
  // We encode the full scanUrl so pointing any iPhone/Android camera immediately triggers check-in
  const qrDataUrl = await QRCode.toDataURL(scanUrl, {
    width: 440,
    margin: 2,
    color: {
      dark: mode === "exit" ? "#1f1406" : "#08090a",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });

  return {
    nonce,
    tokenString,
    qrDataUrl,
    scanUrl,
    mode,
    expiresAt,
    remainingSeconds: TOKEN_TTL_SECONDS,
  };
}

/**
 * Validates a single-use turnstile QR token.
 * Supports v3 (mode-aware), v2 (single-use), and legacy formats.
 */
export function verifyGymRotatingQr(
  tenantId: string,
  rawToken: string
): {
  valid: boolean;
  nonce?: string;
  mode?: KioskMode;
  reason?: string;
} {
  if (!rawToken) {
    return { valid: false, reason: "Missing check-in QR token" };
  }

  // If a full URL was scanned, extract token parameter
  let tokenString = rawToken;
  if (rawToken.includes("token=")) {
    try {
      const parsedUrl = new URL(rawToken);
      tokenString = parsedUrl.searchParams.get("token") || rawToken;
    } catch {
      // Not a full URL, continue with rawToken
    }
  }

  // 1. Support v3 (mode-aware per-scan unique) tokens
  if (tokenString.startsWith("gymerp:v3:")) {
    const parts = tokenString.split(":");
    if (parts.length !== 7) {
      return { valid: false, reason: "Malformed single-use attendance token" };
    }

    const [, , tokenTenantId, modeStr, nonce, expiresAtStr, tokenSignature] = parts;

    if (tokenTenantId !== tenantId) {
      return { valid: false, reason: "Token belongs to a different gym location" };
    }

    const mode = (modeStr as KioskMode) || "entry";
    const expiresAt = parseInt(expiresAtStr, 10);
    const now = Date.now();

    // 15 seconds grace period for network transit
    if (now > expiresAt + 15 * 1000) {
      return {
        valid: false,
        reason: "Check-in QR code expired. Please scan the newly generated code.",
      };
    }

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac("sha256", QR_SECRET)
      .update(`${tenantId}:${mode}:${nonce}:${expiresAt}`)
      .digest("hex")
      .slice(0, 20);

    if (tokenSignature !== expectedSignature) {
      return { valid: false, reason: "Cryptographic signature mismatch" };
    }

    return { valid: true, nonce, mode };
  }

  // 2. Support v2 (legacy per-scan unique) tokens
  if (tokenString.startsWith("gymerp:v2:")) {
    const parts = tokenString.split(":");
    if (parts.length !== 6) {
      return { valid: false, reason: "Malformed single-use attendance token" };
    }

    const [, , tokenTenantId, nonce, expiresAtStr, tokenSignature] = parts;

    if (tokenTenantId !== tenantId) {
      return { valid: false, reason: "Token belongs to a different gym location" };
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    const now = Date.now();

    if (now > expiresAt + 15 * 1000) {
      return {
        valid: false,
        reason: "Check-in QR code expired. Please scan the current code.",
      };
    }

    const expectedSignature = crypto
      .createHmac("sha256", QR_SECRET)
      .update(`${tenantId}:${nonce}:${expiresAt}`)
      .digest("hex")
      .slice(0, 20);

    if (tokenSignature !== expectedSignature) {
      return { valid: false, reason: "Cryptographic signature mismatch" };
    }

    return { valid: true, nonce, mode: "entry" };
  }

  // 3. Backward compatibility with v1 2-hour window tokens
  if (tokenString.startsWith("grym:v1:")) {
    const parts = tokenString.split(":");
    if (parts.length === 5) {
      const [, , tokenTenantId, windowStr, tokenSignature] = parts;
      if (tokenTenantId !== tenantId) {
        return { valid: false, reason: "Token belongs to a different gym location" };
      }

      const parsedWindow = parseInt(windowStr, 10);
      const now = Date.now();
      const currentWindow = Math.floor(now / (2 * 60 * 60 * 1000));

      if (parsedWindow !== currentWindow) {
        return { valid: false, reason: "Legacy QR token expired" };
      }

      const expectedSignature = crypto
        .createHmac("sha256", QR_SECRET)
        .update(`${tenantId}:${parsedWindow}`)
        .digest("hex")
        .slice(0, 16);

      if (tokenSignature !== expectedSignature) {
        return { valid: false, reason: "Invalid signature" };
      }

      return { valid: true, nonce: `legacy-${parsedWindow}`, mode: "entry" };
    }
  }

  return { valid: false, reason: "Unrecognized QR code format" };
}
