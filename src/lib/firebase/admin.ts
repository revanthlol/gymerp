import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

function formatPrivateKey(key: string | undefined): string {
  if (!key) return "";
  let formatted = key.trim();
  // Strip surrounding quotes if present
  if (
    (formatted.startsWith('"') && formatted.endsWith('"')) ||
    (formatted.startsWith("'") && formatted.endsWith("'"))
  ) {
    formatted = formatted.slice(1, -1).trim();
  }
  // Check if base64 encoded
  if (!formatted.includes("BEGIN PRIVATE KEY") && !formatted.includes("\n")) {
    try {
      const decoded = Buffer.from(formatted, "base64").toString("utf8");
      if (decoded.includes("BEGIN PRIVATE KEY")) {
        formatted = decoded.trim();
      }
    } catch {
      // Fall through
    }
  }
  return formatted.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  // Strategy 1: Entire Service Account JSON string or Base64 in environment variable
  let serviceAccountJsonStr =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
    process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountJsonStr) {
    try {
      let rawJson = serviceAccountJsonStr.trim();
      // If base64 encoded (does not start with {), decode it
      if (!rawJson.startsWith("{")) {
        try {
          const decoded = Buffer.from(rawJson, "base64").toString("utf8");
          if (decoded.trim().startsWith("{")) {
            rawJson = decoded.trim();
          }
        } catch {
          // Keep rawJson
        }
      }
      const serviceAccount = JSON.parse(rawJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket:
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
          `${serviceAccount.project_id}.firebasestorage.app`,
      });
      console.log("✓ Firebase Admin initialized via FIREBASE_SERVICE_ACCOUNT_KEY (JSON/Base64)");
    } catch (err) {
      console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", err);
    }
  }

  // Strategy 2: Service Account JSON file path (Local development)
  if (!admin.apps.length) {
    const serviceAccountPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = JSON.parse(
          fs.readFileSync(serviceAccountPath, "utf8")
        );
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket:
            process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
            `${serviceAccount.project_id}.firebasestorage.app`,
        });
        console.log("✓ Firebase Admin initialized via service account file");
      } catch (err) {
        console.error("❌ Failed to read service account file:", err);
      }
    }
  }

  // Strategy 3: Explicit FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || "gym-erp-firebase";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (clientEmail && privateKey) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
        console.log("✓ Firebase Admin initialized via FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY");
      } catch (err) {
        console.error("❌ Failed to initialize Firebase Admin via individual credentials:", err);
      }
    } else {
      console.warn(
        "⚠️ WARNING: No valid Firebase Admin credentials found! Set FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL, or FIREBASE_SERVICE_ACCOUNT_KEY."
      );
      admin.initializeApp({
        projectId,
      });
    }
  }
}

export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
