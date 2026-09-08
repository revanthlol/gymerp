import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

function formatPrivateKey(key: string | undefined): string {
  if (!key) return "";
  if (!key.includes("BEGIN PRIVATE KEY") && !key.includes("\n")) {
    try {
      return Buffer.from(key, "base64").toString("utf8");
    } catch {
      // Fall through to normal string
    }
  }
  return key.replace(/\\n/g, "\n");
}

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
    } catch (err) {
      console.error("Failed to initialize Firebase Admin from service account file:", err);
    }
  }

  // Fallback to explicit env variables if app not initialized
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || "gym-erp-firebase";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
      admin.initializeApp({
        projectId,
      });
    }
  }
}

export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
