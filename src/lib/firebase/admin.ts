import * as admin from "firebase-admin";

function formatPrivateKey(key: string | undefined): string {
  if (!key) return "";
  // If base64 encoded
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
  const projectId = process.env.FIREBASE_PROJECT_ID || "gymerp-dev";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk@gymerp-dev.iam.gserviceaccount.com";
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    // Development fallback without active service account credentials
    admin.initializeApp({
      projectId,
    });
  }
}

export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
