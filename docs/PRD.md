# GymERP — Product Requirements Document (PRD)

**Status:** Production Ready / Deployed  
**Target:** Independent Gyms, Fitness Clubs, Martial Arts Dojos, Strength Centers  

---

## 1. Executive Summary

GymERP is a high-performance, multi-tenant ERP and access control system designed specifically for independent gym operators and fitness centers. It solves two critical industry pain points:
1. **Pass Sharing Fraud**: Unregistered guests sneaking in using screenshots or shared barcodes.
2. **Rush-Hour Front-Desk Latency**: Slow legacy desktop software and turnstile bottleneck delays during morning and evening rush hours.

---

## 2. User Roles & Hierarchy

| Role | Scope | Database Access | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Platform Superadmin** (`platform`) | Global Fleet | `tenants` table only. Zero access to member PII. | Provision gym tenants, toggle lifecycle (`trial`, `active`, `suspended`), manage license durations (+30d, +90d, +1yr, lifetime), execute admin password resets. |
| **Gym Admin** (`admin`) | Single Gym Tenant | Full CRUD within assigned `tenant_id`. | Configure membership plans, manage staff accounts, inspect revenue analytics, manage group classes. |
| **Front-Desk Staff** (`staff`) | Single Gym Tenant | Read/write members, check-ins, manual payments. | Search members, register walk-in signups, operate self-service QR check-in kiosk terminal. |
| **Gym Member** (`member`) | Personal Account | Member's own profile, bookings, and passes. | Launch dynamic smartphone entry pass, book group classes, view workout history and streak records. |

---

## 3. Core Functional Capabilities

### 3.1 Dynamic Rotating QR Pass (Anti-Proxy Protection)
- Members open their smartphone entry pass in the Member Portal (`/portal`).
- A cryptographically signed token rotates every 20 seconds with visual countdown timer.
- Screenshots taken by members expire within seconds, completely eliminating pass sharing.

### 3.2 Dead-Phone Keypad Backup
- If an athlete arrives with 0% battery, they switch the front-desk kiosk to **Keypad Mode**.
- Entering their phone number displays their photo avatar and active membership status instantly, allowing staff to authorize entry.

### 3.3 High-Performance Attendance Engine
- Sub-50ms barcode/QR validation powered by the dedicated Fastify backend (`/api/attendance/scan`).
- Automatically resolves check-in vs check-out from the member's last attendance record.
- Live occupancy counter tracking active members on the gym floor.

### 3.4 Multi-Tenant Lifecycle & Billing
- Superadmins provision gyms with isolated tenant IDs.
- Automatic grace period alerts and access suspension upon plan expiry.
- Hidden backdoor access to Platform Console (`Ctrl+Shift+P` or 5 clicks on footer "G" logo).

### 3.5 Group Classes & Scheduling
- Admins create recurring and one-off group fitness classes.
- Capacity limits and real-time spot reservations through the Member Portal.

---

## 4. Non-Functional Requirements

- **Latency**: Sub-50ms turnstile verification under concurrent load.
- **Availability**: 99.9% uptime with persistent connection pooling on Neon PostgreSQL.
- **Security**: PostgreSQL Row-Level Security, zero Superadmin access to member data, HTTP-only secure cookies.
- **Visual Design**: Sleek dual light/dark mode, frosted glass floating navigation, minimal anti-AI aesthetic.
