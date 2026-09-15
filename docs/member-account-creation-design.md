# Architecture & Design Specification: Member Account Creation Flow

> **Status:** Specification Only (Do Not Implement Yet)  
> **Target System:** GymERP Multi-Tenant SaaS  
> **Scope:** Member Onboarding, Email-Only Authentication, Credential Generation, Transactional Email Delivery  

---

## 1. Executive Summary & Design Principles

The member account creation flow is being streamlined to eliminate frictional onboarding steps and redundant personal data collection. Specifically:
- **Phone Number Dropped:** Mobile phone numbers are removed from the member registration and login requirements. Member identity is strictly anchored to a validated, unique email address.
- **Dual-Path Password Onboarding:** Upon creation by gym staff/admin:
  1. A cryptographically secure temporary password is generated.
  2. A secure, single-use password reset link is generated (24-hour TTL).
  3. A minimal, responsive HTML transactional email is dispatched containing both the reset link and the temporary credentials.
- **Zero-Friction Access:** The member can either click the one-touch reset link to immediately establish their permanent password, or use the temporary password at `/member/login` (which triggers a forced password change modal before granting access).

---

## 2. Proposed Architecture & Data Models

### 2.1 Schema Updates (`prisma/schema.prisma`)

```prisma
model Member {
  id                  String               @id @default(cuid())
  tenantId            String               @map("tenant_id")
  email               String               // Scoped unique per tenant or global unique
  name                String
  status              MemberStatus         @default(ACTIVE)
  joinedDate          DateTime             @default(now()) @map("joined_date")
  
  // Authentication & Security
  passwordHash        String?              @map("password_hash")
  mustResetPassword   Boolean              @default(true) @map("must_reset_password")
  resetTokenHash      String?              @map("reset_token_hash")
  resetTokenExpiresAt DateTime?            @map("reset_token_expires_at")
  lastLoginAt         DateTime?            @map("last_login_at")
  
  // Relations
  tenant              Tenant               @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  memberships         MemberPlanSnapshot[]
  attendanceRecords   AttendanceRecord[]

  @@unique([tenantId, email], name: "tenant_member_email_key")
  @@index([email])
  @@map("members")
}
```

### 2.2 Token & Credential Lifecycle

```
[ Admin creates Member in Portal ]
              │
              ├──> 1. Generate temp password: crypto.randomBytes(6).toString("hex")  (e.g., 'a8f3b29c1e0d')
              ├──> 2. Generate raw reset token: crypto.randomBytes(32).toString("hex") (256-bit entropy)
              ├──> 3. Store hash: resetTokenHash = sha256(rawToken), resetTokenExpiresAt = now() + 24h
              ├──> 4. Hash temp password: passwordHash = argon2id(tempPassword)
              │
              ▼
[ Dispatch Transactional Email ]
              │
              ├──> Contains: Temp Password + Reset Link: https://<domain>/member/reset-password?token=<rawToken>
              │
      ┌───────┴───────────────────────────┐
      ▼                                   ▼
[ Path A: Clicks Reset Link ]        [ Path B: Uses Temp Password ]
  • Navigates to /member/reset-password • Navigates to /member/login
  • Validates sha256(token) & TTL       • Validates argon2id(tempPassword)
  • Enters new password                 • mustResetPassword === true detected
  • Sets mustResetPassword = false      • Forces immediate modal: "Set Permanent Password"
  • Clears resetTokenHash               • Redirects to /member dashboard
```

---

## 3. Transactional Email Provider Evaluation & Benchmark

To power outbound emails (welcome invitations, password resets, payment invoices), we evaluated modern transactional email platforms on free-tier limits, per-email costs, developer experience, and deliverability.

| Provider | Free Tier Allowance | Paid Pricing Tier | Next.js / Edge Friendly | Key Advantages | Tradeoffs / Gotchas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Resend** *(Recommended)* | **3,000 emails/mo** (100/day limit) | $20/mo for 50,000 emails | Native SDK (`resend`), full support for Edge / Serverless & React Email | • Built specifically for modern web apps<br>• First-class `@react-email/components`<br>• Clean dashboard & webhooks<br>• Fast domain DKIM/SPF verification | 100 emails/day ceiling on free tier may require upgrade if gyms onboard >100 members in a single day |
| **Brevo** *(formerly Sendinblue)* | **300 emails/day** (9,000/mo) | $9/mo for 5,000 emails | Node SDK / REST API | • Generous free daily quota (300/day)<br>• Integrated contact management & SMS<br>• Unlimited contacts on free tier | • SDK is bulkier compared to modern ESM packages<br>• Unbranded headers on free tier |
| **AWS SES** | None (unless hosted on EC2: 62k/mo free) | **$0.10 per 1,000 emails** | AWS SDK v3 (`@aws-sdk/client-ses`) | • Lowest unit economics at enterprise scale<br>• Highest infrastructure reliability | • Mandatory AWS Sandbox exit approval required<br>• No native HTML templating engine<br>• Complex IAM & DNS setup |
| **Postmark** | 100 emails total test credits | $15/mo for 10,000 emails | Node SDK (`postmark`) | • Industry-leading inbox placement<br>• Sub-second delivery speeds<br>• Superb analytics | No persistent free tier (strictly a paid production tool) |

### Recommendation
**Resend** is recommended for GymERP:
1. Native integration with Next.js App Router and TypeScript.
2. Supports React-based transactional templates (`react-email`), allowing email designs to share CSS tokens and brand styles directly with the GymERP codebase.
3. If the 100 email/day limit is constrained during mass migrations, **Brevo** serves as an immediate drop-in via standard SMTP or REST fallback.

---

## 4. Minimal HTML Email Template

Below is the production-ready HTML template engineered for universal client rendering (Apple Mail, Gmail, Outlook, iOS/Android Mail) with dark mode adaptation.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Welcome to {{gymName}}</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 16px;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }
    .header {
      padding: 32px 32px 20px 32px;
      border-bottom: 1px solid #f1f5f9;
    }
    .gym-name {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #d97706;
      margin: 0;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 8px 0 0 0;
      line-height: 1.3;
    }
    .body {
      padding: 32px;
      font-size: 15px;
      line-height: 1.6;
      color: #334155;
    }
    .credential-box {
      margin: 24px 0;
      padding: 18px 20px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }
    .credential-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin: 0 0 6px 0;
    }
    .credential-value {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.04em;
      margin: 0;
    }
    .cta-container {
      margin: 32px 0 20px 0;
      text-align: center;
    }
    .cta-button {
      display: inline-block;
      background-color: #0f172a;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 13px 28px;
      border-radius: 10px;
      letter-spacing: 0.02em;
    }
    .footer {
      padding: 24px 32px;
      background-color: #f8fafc;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
    }
    @media (prefers-color-scheme: dark) {
      body, .wrapper {
        background-color: #090a0f !important;
      }
      .container {
        background-color: #11131a !important;
        border-color: #1e2230 !important;
      }
      .header {
        border-bottom-color: #1e2230 !important;
      }
      .title {
        color: #f8fafc !important;
      }
      .body {
        color: #cbd5e1 !important;
      }
      .credential-box {
        background-color: #161922 !important;
        border-color: #262b3d !important;
      }
      .credential-value {
        color: #f8fafc !important;
      }
      .cta-button {
        background-color: #f59e0b !important;
        color: #000000 !important;
      }
      .footer {
        background-color: #0d0e14 !important;
        border-top-color: #1e2230 !important;
        color: #64748b !important;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <p class="gym-name">{{gymName}}</p>
        <h1 class="title">Welcome, {{memberName}}</h1>
      </div>
      <div class="body">
        <p style="margin-top: 0;">
          Your member account has been created. You can now access your member portal to check your membership status, track attendance, and generate entrance QR codes.
        </p>

        <div class="cta-container">
          <a href="{{resetUrl}}" class="cta-button" target="_blank">
            Set Your Permanent Password &rarr;
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 24px;">
          This setup link will expire in 24 hours.
        </p>

        <div class="credential-box">
          <p class="credential-label">Temporary Account Password</p>
          <p class="credential-value">{{temporaryPassword}}</p>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
          Prefer logging in directly? Head over to <a href="{{loginUrl}}" style="color: #d97706; text-decoration: underline;">{{loginUrl}}</a> with your email and the temporary password above.
        </p>
      </div>

      <div class="footer">
        <p style="margin: 0;">
          This message was sent for your account at <strong>{{gymName}}</strong>. If you did not sign up for this membership, please ignore this email or contact front-desk staff.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 5. Security & Threat Mitigation

1. **Password Generation:**
   - Generated using `crypto.randomBytes(6).toString("hex")` or high-entropy alphanumeric generators.
   - Hashed using **argon2id** with memory cost 65536 and time cost 3 before database storage.
2. **Reset Token Handling:**
   - Raw tokens are sent in email query strings (`?token=rawToken`).
   - The database stores **only** the SHA-256 hash of the token (`resetTokenHash`).
   - If the database is compromised, active reset tokens cannot be reconstructed.
3. **Rate Limiting:**
   - Password reset verification endpoints must be rate-limited using an in-memory/Upstash Redis token bucket: max 5 attempts per IP per minute.
4. **Single Use:**
   - Once a password is reset or overwritten, `resetTokenHash` and `resetTokenExpiresAt` are immediately set to `null`.
