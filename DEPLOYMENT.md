# GymERP Production Deployment Guide

This guide outlines exactly **what** to deploy and **where** to deploy each component of the GymERP multi-tenant architecture.

---

## 1. Architectural Distribution ("What Goes Where")

| Component | Responsibility | Recommended Host | Alternatives |
| :--- | :--- | :--- | :--- |
| **App & API Tier** | Next.js 14 App Router, Server Actions, Auth Session Cookies, Kiosk APIs | **Vercel** | Railway, AWS Amplify, Docker VPS (Coolify/Fly.io) |
| **Database Tier** | Multi-tenant PostgreSQL with Row-Level Security (RLS) policies | **Neon** (Serverless Postgres) | Supabase, Aiven, AWS RDS |
| **Auth & Identity** | User credentials, password reset, JWT token claims (`role`, `tenant_id`) | **Firebase Auth** | Google Cloud Identity Platform |
| **Kiosk & Turnstiles** | Real-time 2-hour rotating QR display, barcode/camera scanner | **Front-Desk Tablet** / Mini-PC (Browser in Kiosk mode) | iPad Guided Access, Android Fully Kiosk |
| **Payments (Optional)** | Membership subscriptions & point-of-sale checkout | **Razorpay** / **Stripe** | Cash / Manual POS |

---

## 2. Step 1: Deploy Database (PostgreSQL with RLS)

> [!IMPORTANT]
> Because Vercel uses serverless lambda functions, your PostgreSQL database **must use connection pooling** to prevent pool exhaustion.

### Option A: Neon (Recommended)
1. Sign up at [neon.tech](https://neon.tech) and create a project (e.g., `gymerp-prod`).
2. Go to **Dashboard** > **Connection Details**.
3. Select **Pooled connection** and copy the connection string. It will look like:
   ```env
   DATABASE_URL="postgresql://user:password@ep-cool-rock-12345-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

### Option B: Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Settings** > **Database** > **Connection Pooling**.
3. Copy the **Transaction** connection string (Port `6543` with `pgbouncer=true`).

### Apply Migrations & Seed to Remote DB
Before deploying the frontend, run the database schema and RLS policies on your production database:

```bash
# 1. Temporarily point local terminal to remote production database URL:
export DATABASE_URL="postgresql://user:password@ep-pooler.your-host.com/gymerp?sslmode=require"

# 2. Run Drizzle migrations & RLS policies
pnpm db:migrate

# 3. Initialize base tenants, users, and plans (zero dummy operational data)
pnpm db:seed
```

---

## 3. Step 2: Configure Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/) and open your project (`gym-erp-firebase`).
2. **Enable Authentication Provider**:
   - Go to **Build** > **Authentication** > **Sign-in method**.
   - Enable **Email/Password**.
3. **Whitelist Production Domain**:
   - Go to **Authentication** > **Settings** > **Authorized domains**.
   - Add your Vercel deployment domain (e.g., `gymerp.vercel.app` and your custom domain `app.yourgym.com`).
4. **Generate Service Account Credentials (Firebase Admin)**:
   - Go to **Project settings** (gear icon) > **Service accounts**.
   - Click **Generate new private key** (downloads a `.json` file).
   - Keep this file secure. You will copy `project_id`, `client_email`, and `private_key` into Vercel environment variables.

---

## 4. Step 3: Deploy Frontend to Vercel

1. Push your latest code to your GitHub/GitLab repository:
   ```bash
   git push origin main
   ```
2. Log in to [Vercel](https://vercel.com) and click **Add New...** > **Project**.
3. Import the `gymerp` repository.
4. **Build & Development Settings**:
   - Framework Preset: `Next.js`
   - Root Directory: `./`
   - Build Command: `pnpm build` (or Next default)
   - Node.js Version: `20.x`
5. **Add Environment Variables in Vercel Project Settings**:

| Variable | Description / Sample Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `APP_URL` | `https://your-domain.vercel.app` |
| `DATABASE_URL` | `postgresql://user:pass@ep-pooler.neon.tech/neondb?sslmode=require` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSy...` (from Firebase Web Config) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `gym-erp-firebase.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `gym-erp-firebase` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`| `gym-erp-firebase.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `262729876319` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:262729876319:web:...` |
| `FIREBASE_PROJECT_ID` | `gym-erp-firebase` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxxxx@gym-erp-firebase.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` |
| `SESSION_COOKIE_NAME` | `__session` |
| `SESSION_COOKIE_EXPIRES_IN` | `432000` (5 days) |
| `QR_ROTATION_SECRET` | Strong random 32-character string (e.g., `openssl rand -hex 16`) |
| `RAZORPAY_KEY_ID` | *(Optional)* Razorpay production Key ID |
| `RAZORPAY_KEY_SECRET` | *(Optional)* Razorpay production Secret |

6. Click **Deploy**. Vercel will build and publish the application.

---

## 5. Step 4: Setup Turnstile Kiosk Terminal

The Kiosk does not require a dedicated server, local database, or backend installation. It runs directly inside any modern web browser connected to the internet.

1. **Hardware Requirements**:
   - 10"+ Android Tablet, iPad, or Touchscreen Mini-PC mounted at the gym front desk or turnstile gate.
   - High-contrast screen facing athletes for QR code scanning.
   - Optional 2D barcode / QR camera scanner (USB/Bluetooth HID keyboard emulation).
2. **Kiosk Launch**:
   - Navigate to `https://your-domain.vercel.app/login` and log in with staff credentials (`staff@ironpulse.local`).
   - Open `/staff/kiosk`.
   - Put browser in **Fullscreen / Kiosk Mode**:
     - **iPad**: Use **Guided Access** (`Settings > Accessibility > Guided Access`) to pin Safari to full screen without address bars.
     - **Android**: Use Chrome **Add to Home screen** (PWA mode) or **Fully Kiosk Browser**.
     - **Desktop/Windows/ChromeOS**: Press `F11` or launch Chrome with `--kiosk https://your-domain.vercel.app/staff/kiosk`.
3. **Turnstile Integration**:
   - The anti-proxy QR code rotates automatically every 2 hours using HMAC timestamp windows.
   - When an athlete presents their member token or scans the on-screen QR with their camera, the check-in is validated instantaneously via `/api/kiosk/verify`.

---

## 6. Pre-Flight Deployment Checklist

- [ ] Remote PostgreSQL database deployed with connection pooler enabled (`sslmode=require`).
- [ ] `pnpm db:migrate` executed successfully on remote database (RLS policies active).
- [ ] `pnpm db:seed` executed to sync Firebase Auth users and initial tenants.
- [ ] Production domain added to Firebase Console > Authorized Domains.
- [ ] Vercel environment variables configured (including private key with formatted `\n`).
- [ ] Test admin login at `https://your-domain.vercel.app/login`.
- [ ] Test superadmin login at `https://your-domain.vercel.app/platform/login`.
- [ ] Test kiosk interface at `https://your-domain.vercel.app/staff/kiosk`.
