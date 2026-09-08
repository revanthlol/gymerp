# Wireframe: Admin Portal

> **Route:** `/admin`  
> **Role:** Admin (Gym owner / manager)  
> **Scope:** Full CRUD within own tenant — members, plans, payments, reports, settings

---

## User Flow

```mermaid
flowchart TD
    A([Admin login]) --> B[Admin Dashboard]
    B --> C{Navigate to}
    C -->|Members| D[Members List]
    C -->|Plans| E[Plans Grid]
    C -->|Payments| F[Payments Table]
    C -->|Settings| G[Settings Page]

    D --> D1[+ Add Member → Modal]
    D --> D2[Row click → Member Detail Sheet]
    D2 --> D3[Edit Member]
    D2 --> D4[Renew Membership]
    D2 --> D5[Freeze / Unfreeze]
    D2 --> D6[Delete Member]

    E --> E1[+ New Plan → Modal]
    E --> E2[Edit Plan → Modal]
    E --> E3[Archive Plan]

    F --> F1[+ Record Cash Payment → Modal]
    F --> F2[Filter by method / status / date]
```

---

## Shell Layout

```
┌────────────────────────────────────────────────────────────────┐
│ Sidebar (240px)           │  Main Content Area                 │
│                           │                                    │
│  ⊞  FitZone Gym           │  [breadcrumb > page title]         │
│  ─────────────────        │                                    │
│  ⊞  Dashboard   ← active  │  [page-specific content]           │
│  ⊞  Members               │                                    │
│  ⊞  Plans                 │                                    │
│  ⊞  Payments              │                                    │
│  ⊞  Reports               │                                    │
│  ⊞  Settings              │                                    │
│  ─────────────────        │                                    │
│  [avatar] John (Admin)    │                                    │
│  ● ● ● ●  ← theme dots    │                                    │
└────────────────────────────────────────────────────────────────┘
```

---

## Screen 1: Admin Dashboard (`/admin`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Good morning, John.                           FitZone Gym        │
│                                                                   │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────┐ │
│  │  Total        │ │  Active       │ │  Expiring     │ │ Rev.  │ │
│  │  Members      │ │  Members      │ │  (7 days)     │ │ Month │ │
│  │               │ │               │ │               │ │       │ │
│  │    142        │ │    128        │ │     14        │ │₹87.2K │ │
│  │               │ │               │ │               │ │       │ │
│  │ text-display  │ │  ↑3 this wk   │ │  ⚠ action    │ │ ↑12%  │ │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────┘ │
│    [staggered fade-up on load, 80ms delay per card]               │
│                                                                   │
│  ┌────────────────────────────┐ ┌────────────────────────────┐   │
│  │  Recent Payments           │ │  Expiring Soon              │   │
│  │                            │ │                             │   │
│  │  Ravi K.   ₹999  Online   │ │  Priya M.   3 days left    │   │
│  │  Priya M.  ₹2499 Cash     │ │  Arjun S.   5 days left    │   │
│  │  Arjun S.  ₹999  Online   │ │  Meera T.   6 days left    │   │
│  │  [View all payments →]     │ │  [View all →]               │   │
│  └────────────────────────────┘ └────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Attendance — Last 7 Days                                   │  │
│  │                                                             │  │
│  │  Mon  Tue  Wed  Thu  Fri  Sat  Sun                         │  │
│  │  ▇▇   ▇▇▇  ▇▇▇  ▇▇   ▇▇▇  ▇▇▇▇ ▇▇                        │  │
│  │  42   61   58   39   67   78   31                          │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Stat card spec:**
- `p-4`, `bg-surface`, inner accent glow
- Number: `text-display` (36px / 800 weight)
- Label: `text-caption text-secondary`
- Trend line: `text-caption text-green-400` or `text-red-400`

---

## Screen 2: Members Page (`/admin/members`)

```
┌───────────────────────────────────────────────────────────────┐
│  Members                                      [+ Add Member]  │
│                                                               │
│  [🔍 Search members...]  [Status: All ▾]  [Export CSV]        │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐     │
│  │ NAME          │ CONTACT    │ PLAN     │ STATUS  │ JOINED │  │
│  │───────────────┼────────────┼──────────┼─────────┼────── │  │
│  │ Ravi Kumar    │ 9876543210 │ Monthly  │● Active │Jan 25 │  │
│  │ Priya Mehta   │ 9123456789 │ Quarterly│● Expiring│Mar 25 │ │
│  │ Arjun Singh   │ 9988776655 │ Monthly  │● Frozen │Nov 24 │  │
│  │ Meera Thomas  │ 8877665544 │ Annual   │● Active │Jun 24 │  │
│  │ Vikram Rao    │ 7766554433 │ Monthly  │● Expired│Aug 24 │  │
│  │─────────────────────────────────────────────────────  │  │
│  │  ← 1  2  3 →   Showing 1–10 of 142 members           │  │
│  └──────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────┘
```

---

## Screen 2a: Member Detail Sheet (slide-in right)

```
                         ┌─────────────────────────────────────┐
                         │  ✕  Member Details                  │
                         │  ─────────────────────────────────  │
                         │                                     │
                         │  [👤 avatar placeholder]            │
                         │   Ravi Kumar                        │
                         │   ● Active                          │
                         │                                     │
                         │  📞 9876543210                      │
                         │  📧 ravi@email.com                  │
                         │  📅 Joined: Jan 15, 2025            │
                         │                                     │
                         │  ─────────────────────────────────  │
                         │  Current Membership                 │
                         │  Monthly — ₹999/mo                  │
                         │  Expires: Sep 30, 2026              │
                         │  ████████████░░  28 days left       │
                         │                                     │
                         │  ─────────────────────────────────  │
                         │  Payment History                    │
                         │  ₹999  Aug 1   Online  ✓ Paid       │
                         │  ₹999  Jul 1   Cash    ✓ Paid       │
                         │  ₹999  Jun 1   Online  ✓ Paid       │
                         │                                     │
                         │  ─────────────────────────────────  │
                         │  Attendance (last 10)               │
                         │  ✓ Sep 7  10:23am                   │
                         │  ✓ Sep 5  9:15am                    │
                         │  ✓ Sep 3  8:47am                    │
                         │                                     │
                         │  ─────────────────────────────────  │
                         │  [Edit]  [Renew]  [Freeze]  [Delete]│
                         └─────────────────────────────────────┘
```

---

## Screen 3: Plans Page (`/admin/plans`)

```
┌─────────────────────────────────────────────────────────┐
│  Plans                                     [+ New Plan] │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────┐  │
│  │  Monthly         │  │  Quarterly       │  │Annual │  │
│  │  ₹999 / 30 days  │  │  ₹2,499 / 90 days│  │₹7,999 │  │
│  │                  │  │                  │  │365 days│ │
│  │  128 active      │  │  12 active       │  │2 active│ │
│  │                  │  │                  │  │       │  │
│  │  [Edit] [Archive]│  │  [Edit] [Archive]│  │[Edit] │  │
│  └──────────────────┘  └──────────────────┘  └───────┘  │
│                                                         │
│  Archived (1)                                           │
│  ▸ 6-Month Plan — archived Jun 2025                     │
└─────────────────────────────────────────────────────────┘
```

**Plan card spec:**
- `bg-surface`, `p-4`, inner accent glow on hover
- Plan name: `text-title`
- Price: `text-display` accent color
- Active count: `text-caption text-secondary`

---

## Screen 4: Payments Page (`/admin/payments`)

```
┌──────────────────────────────────────────────────────────────┐
│  Payments                         [+ Record Cash Payment]    │
│                                                              │
│  [🔍 Search]  [Method ▾]  [Status ▾]  [Date range]          │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ MEMBER      │ AMOUNT │ METHOD  │ STATUS    │ DATE   │  │   │
│  │─────────────┼────────┼─────────┼───────────┼────────│  │   │
│  │ Ravi Kumar  │ ₹999   │ Online  │ ✓ Paid    │Sep 1  │  │   │
│  │ Priya Mehta │ ₹2,499 │ Cash    │ ✓ Paid    │Aug 28 │  │   │
│  │ Arjun Singh │ ₹999   │ Online  │ ✗ Failed  │Aug 27 │  │   │
│  │ Meera Thomas│ ₹7,999 │ Online  │ ✓ Paid    │Aug 25 │  │   │
│  │─────────────────────────────────────────────────────  │   │
│  │  ← 1  2  →   Showing 1–10 of 38 payments             │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Record Cash Payment modal:**
```
         ┌──────────────────────────────────────┐
         │  Record Cash Payment                 │
         │  ─────────────────────────────────   │
         │                                      │
         │  Member                              │
         │  ┌──────────────────────────────┐    │
         │  │ 🔍 Search member...          │    │
         │  └──────────────────────────────┘    │
         │                                      │
         │  Plan                               │
         │  ┌──────────────────────────────┐    │
         │  │ Monthly — ₹999         ▾     │    │
         │  └──────────────────────────────┘    │
         │                                      │
         │  Amount                             │
         │  ┌──────────────────────────────┐    │
         │  │ ₹999                         │    │
         │  └──────────────────────────────┘    │
         │                                      │
         │  Notes (optional)                   │
         │  ┌──────────────────────────────┐    │
         │  │                              │    │
         │  └──────────────────────────────┘    │
         │                                      │
         │  [Cancel]     [Record Payment →]     │
         └──────────────────────────────────────┘
```
