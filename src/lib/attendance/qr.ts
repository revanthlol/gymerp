import crypto from "crypto";
import QRCode from "qrcode";

const QR_SECRET = process.env.QR_ROTATION_SECRET || "gymerp-attendance-single-use-salt-2026";
const TOKEN_TTL_SECONDS = 120; // 2 minutes dynamic expiry per QR code

export interface UniqueQrData {
  nonce: string;
  tokenString: string;
  qrDataUrl: string;
  expiresAt: number; // Unix ms
  remainingSeconds: number;
}

/**
 * Generates a single-use dynamic QR code unique to each scan session.
 * Automatically rotates immediately upon each check-in scan or after 120s expiry.
 */
export async function generateGymRotatingQr(tenantId: string): Promise<UniqueQrData> {
  const nonce = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + TOKEN_TTL_SECONDS * 1000;

  // Cryptographic HMAC signature guaranteeing origin & authenticity
  const signature = crypto
    .createHmac("sha256", QR_SECRET)
    .update(`${tenantId}:${nonce}:${expiresAt}`)
    .digest("hex")
    .slice(0, 20);

  const tokenString = `gymerp:v2:${tenantId}:${nonce}:${expiresAt}:${signature}`;

  // High-contrast clean QR for instant camera & scanner detection
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
    nonce,
    tokenString,
    qrDataUrl,
    expiresAt,
    remainingSeconds: TOKEN_TTL_SECONDS,
  };
}

/**
 * Validates a single-use turnstile QR token.
 * Extracts nonce for atomic anti-replay consumption in database.
 */
export function verifyGymRotatingQr(
  tenantId: string,
  tokenString: string
): {
  valid: boolean;
  nonce?: string;
  reason?: string;
} {
  if (!tokenString) {
    return { valid: false, reason: "Missing turnstile QR token" };
  }

  // Support v2 (per-scan unique) tokens
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

    // 15 seconds grace period for network transit
    if (now > expiresAt + 15 * 1000) {
      return {
        valid: false,
        reason: "Turnstile QR code expired. Please scan the newly generated code.",
      };
    }

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac("sha256", QR_SECRET)
      .update(`${tenantId}:${nonce}:${expiresAt}`)
      .digest("hex")
      .slice(0, 20);

    if (tokenSignature !== expectedSignature) {
      return { valid: false, reason: "Cryptographic signature mismatch" };
    }

    return { valid: true, nonce };
  }

  // Backward compatibility with v1 2-hour window tokens
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

      return { valid: true, nonce: `legacy-${parsedWindow}` };
    }
  }

  return { valid: false, reason: "Unrecognized QR code format" };
}
