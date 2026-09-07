# GymERP — UI Design System & Wireframes

---

## 1. Design Language

### Core Philosophy
**Dark-first · Gym-industrial · Glassmorphic accents · Dense but readable**

The UI is built for daily use by gym staff who need data fast, and gym owners who want a premium feel without clutter. The glassmorphism is **subtle** — inner-edge glow, frosted surfaces, not heavy blur. Think icy edges, not foggy windows.

---

## 2. Color System

### Base Palette (Dark, fixed)
| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#0A0A0A` | App background |
| `--bg-surface` | `#111113` | Cards, panels, sidebar |
| `--bg-elevated` | `#1A1A1F` | Modals, dropdowns, popovers |
| `--bg-muted` | `#222228` | Table row hover, input bg |
| `--border` | `rgba(255,255,255,0.08)` | Subtle borders |
| `--border-strong` | `rgba(255,255,255,0.15)` | Card outlines, dividers |
| `--text-primary` | `#F4F4F5` | Headings, labels |
| `--text-secondary` | `#A1A1AA` | Descriptions, meta |
| `--text-muted` | `#52525B` | Placeholders, disabled |

### Accent Themes (User-selectable, Orange default)

Each theme defines these tokens:

| Token | Role |
|---|---|
| `--accent` | Primary CTAs, active nav items, badges |
| `--accent-hover` | Hover state of accent |
| `--accent-glow` | Inner-edge glow color (15-20% opacity) |
| `--accent-subtle` | Tinted backgrounds (badges, highlights) |
| `--accent-foreground` | Text on accent-colored surfaces |

#### Available Themes

| Theme | `--accent` | `--accent-glow` | Personality |
|---|---|---|---|
| **Orange** (default) | `#FF5722` | `rgba(255,87,34,0.18)` | Energetic, gym-forward |
| **Electric Blue** | `#00B4FF` | `rgba(0,180,255,0.18)` | Tech, trustworthy |
| **Neon Green** | `#39FF14` | `rgba(57,255,20,0.15)` | Bold, status-forward |
| **Vivid Purple** | `#8B5CF6` | `rgba(139,92,246,0.18)` | Premium, edgy |

Theme is stored in Zustand, persisted to `localStorage`, applied as a `data-theme="orange"` attribute on `<html>`.

### Glassmorphism Recipe
```css
/* Glassy card / panel */
background: rgba(17, 17, 19, 0.85);
border: 1px solid var(--border);
box-shadow: inset 0 0 0 1px var(--accent-glow),
            0 1px 1px rgba(0,0,0,0.4);
backdrop-filter: blur(8px);
border-radius: 10px;

/* Active / focused element inner glow */
box-shadow: inset 0 0 12px var(--accent-glow),
            0 0 0 1px var(--accent);
```

---

## 3. Typography

### Font Stack
- **Primary:** `Inter` (all body copy, labels, table data, navigation)
- **Display:** `Inter` in `font-weight: 700-800` with `letter-spacing: -0.03em` for page headings and stat numbers
- **Mono:** `JetBrains Mono` for IDs, QR tokens, payment references

### Scale (Tailwind custom)
| Token | Size | Weight | Usage |
|---|---|---|---|
| `text-display` | `2.25rem / 36px` | 800 | Page titles, big stat numbers |
| `text-title` | `1.25rem / 20px` | 700 | Section headings, card titles |
| `text-body` | `0.875rem / 14px` | 400 | Table data, descriptions |
| `text-caption` | `0.75rem / 12px` | 400 | Meta, timestamps, badges |
| `text-label` | `0.75rem / 12px` | 600 | Form labels, column headers |
| `text-mono` | `0.8125rem / 13px` | 400 | IDs, codes |

### Visual Variety Rules
- Page-level `h1` always uses the display scale with accent color or a subtle gradient clip
- Stat cards: giant number in `text-display`, label in `text-caption text-secondary`
- Table column headers in `text-label uppercase tracking-wider text-muted`
- Never mix more than 2 font weights in a single component

---

## 4. Layout

### Shell Structure
```
┌──────────────────────────────────────────────┐
│  Sidebar (240px collapsed → 56px)            │
│  ┌────────────────────────────────────────┐  │
│  │  Logo / Tenant Name                    │  │
│  │  ──────────────────                    │  │
│  │  Nav items (role-aware)                │  │
│  │  • Dashboard                           │  │
│  │  • Members                             │  │
│  │  • Plans & Payments                    │  │
│  │  • Attendance                          │  │
│  │  • Settings                            │  │
│  │  ──────────────────                    │  │
│  │  User avatar + role badge              │  │
│  │  Theme picker (4 dot swatches)         │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  Main Content Area                            │
│  ┌────────────────────────────────────────┐  │
│  │  Page Header (breadcrumb + actions)    │  │
│  │  ──────────────────────────────────    │  │
│  │  Content                               │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Density
- **Sidebar:** `py-1` item padding, `h-9` per nav item. Compact.
- **Tables:** `h-10` row height, `text-sm`, no row borders (use alternating bg instead or just zebra on hover)
- **Cards:** `p-4` internal padding, `gap-3` between elements
- **Forms:** `space-y-4` field spacing, `h-9` inputs

---

## 5. Component System

### Status Badges
```
● Active    → accent-colored dot + accent-subtle bg
● Expired   → red dot + red-subtle bg
● Frozen    → blue dot + blue-subtle bg
● Trial     → yellow dot + yellow-subtle bg
● Suspended → destructive red
```

### Buttons
| Variant | Style |
|---|---|
| Primary | Solid `--accent` bg, dark text, accent glow on hover |
| Secondary | `bg-elevated border` with hover bg shift |
| Ghost | Transparent, `text-secondary`, accent on hover |
| Destructive | `bg-red-900/30 border-red-800 text-red-400` |

### Data Table
- Column headers: `text-label uppercase tracking-wider text-muted`
- Sortable indicator: subtle chevron in accent color
- Row hover: `bg-muted/60`
- Pagination: compact, bottom of table
- Search: top-right of table header
- Filter chips: accent-subtle background

---

## 6. Screen Wireframes

### 6.1 Login Page (shared, all roles)
```
┌─────────────────────────────────────────┐
│                                         │
│           [Logo + GymERP]               │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  Glassy card                    │   │
│   │  ─────────────────────────────  │   │
│   │  Email ________________         │   │
│   │  Password _____________ [eye]   │   │
│   │                                 │   │
│   │  [Sign In ──────────────────]   │   │
│   │   ← accent button, full width   │   │
│   └─────────────────────────────────┘   │
│                                         │
│   Role is auto-detected from JWT        │
│   → redirects to correct route group   │
└─────────────────────────────────────────┘
```
- Centered card, `max-w-sm`
- Background: `bg-base` with subtle radial gradient glow behind card (accent color, very low opacity ~5%)
- Logo: wordmark + a minimal barbell/dumbbell icon

---

### 6.2 Platform Dashboard (`/platform`)
```
Sidebar nav items: Tenants | Settings | Account

Main:
┌──────────────────────────────────────────┐
│  Tenants                   [+ New Tenant]│
│                                          │
│  [Search]           [Status filter ▾]   │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Name  │ Status  │ Members │ Since  │  │
│  │───────┼─────────┼─────────┼──────  │  │
│  │ Gym A │ ● Active│ 142     │ Jan 25 │  │
│  │ Gym B │ ● Trial │ 0       │ Aug 26 │  │
│  │ Gym C │ Suspnd  │ 89      │ Mar 24 │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘

Tenant detail drawer (slide-in from right):
  Tenant info | Status toggle | Suspend/Activate CTA
```

---

### 6.3 Admin Dashboard (`/admin`)
```
Sidebar: Dashboard | Members | Plans | Payments | Reports | Settings

Main (Dashboard Home):
┌───────────────────────────────────────────────────┐
│  Good morning, [Name]         [Gym Name]           │
│                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │
│  │  Total   │ │  Active  │ │  Expiring│ │Rev.  │ │
│  │  Members │ │  Members │ │  7 days  │ │Month │ │
│  │  [NUM]   │ │  [NUM]   │ │  [NUM]   │ │₹[NUM]│ │
│  └──────────┘ └──────────┘ └──────────┘ └──────┘ │
│                                                    │
│  ┌──────────────────────┐ ┌────────────────────┐  │
│  │  Recent Payments     │ │  Expiring Soon     │  │
│  │  [mini table]        │ │  [member list]     │  │
│  └──────────────────────┘ └────────────────────┘  │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  Attendance (last 7 days) — bar sparkline    │ │
│  └──────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

#### Members Page (`/admin/members`)
```
[+ Add Member]  [Search]  [Status filter]  [Export]

DataTable:
  Name | Contact | Plan | Status | Joined | Actions
  
Row expand / row click → Member Detail Sheet (slide-in):
  Photo placeholder | Name | Status badge
  Current plan + expiry
  Payment history (compact list)
  Attendance history (last 10)
  [Edit] [Renew] [Freeze] [Delete]
```

#### Plans Page (`/admin/plans`)
```
[+ New Plan]

Cards grid (not table — plans are few):
┌─────────────────┐ ┌─────────────────┐
│ Monthly - ₹999  │ │ Quarterly -     │
│ 30 days         │ │ ₹2499, 90 days  │
│ 142 active      │ │ 67 active       │
│ [Edit] [Archive]│ │ [Edit] [Archive]│
└─────────────────┘ └─────────────────┘
```

#### Payments Page (`/admin/payments`)
```
[Search]  [Method filter]  [Status filter]  [Date range]

DataTable:
  Member | Amount | Method | Status | Date | Receipt
  
[+ Record Cash Payment] → modal with member search + amount + plan
```

---

### 6.4 Staff Dashboard (`/staff`)
```
Sidebar: Check-in | Members | Payments | My Shift

Staff home is minimal — quick actions:
┌──────────────────────────────────┐
│  ┌──────────────┐ ┌───────────┐  │
│  │  [QR ICON]   │ │  MEMBERS  │  │
│  │  Check-In    │ │  List     │  │
│  └──────────────┘ └───────────┘  │
│  ┌──────────────┐ ┌───────────┐  │
│  │  MANUAL      │ │  TODAY'S  │  │
│  │  Payment     │ │  Log      │  │
│  └──────────────┘ └───────────┘  │
└──────────────────────────────────┘

Recent check-ins today (live, bottom of page)
```

---

### 6.5 Check-In Kiosk (`/staff/checkin`) — PWA Fullscreen
```
┌───────────────────────────────────────────┐
│                                           │
│  GymERP          [Gym Name]  [Exit kiosk] │
│  ─────────────────────────────────────── │
│                                           │
│         ┌─────────────────────┐           │
│         │                     │           │
│         │    CAMERA FEED      │           │
│         │    [QR scan area]   │           │
│         │    corner brackets  │           │
│         │    in accent color  │           │
│         └─────────────────────┘           │
│                                           │
│         Scan member QR code               │
│                                           │
│  ─────────────────────────────────────── │
│                                           │
│   ┌──── SUCCESS STATE ────────────────┐   │
│   │  ✓  [Member Name]                │   │
│   │     [Plan]  Expires [date]        │   │
│   │     ● Active                      │   │
│   └───────────────────────────────────┘   │
│                                           │
│   ┌──── EXPIRED/ERROR STATE ──────────┐   │
│   │  ✗  [Member Name]                │   │
│   │     Membership EXPIRED           │   │
│   │     [Contact Admin]              │   │
│   └───────────────────────────────────┘   │
│                                           │
│  ────────────────────────────────────── │
│  Today's check-ins: [NUM]   [View Log]   │
└───────────────────────────────────────────┘
```

- **Success:** green glow pulse animation on the card
- **Expired:** red glow pulse
- State resets after 3 seconds, returns to scan state
- Offline queue: if network drops, scan is queued locally (IndexedDB), indicator shows "Queued" state in amber
- No sidebar, no nav — pure kiosk mode. `display: standalone` in manifest targets this screen

---

### 6.6 Theme Picker (in sidebar, bottom)
```
Accent:
  ○ ○ ○ ○   ← 4 dot swatches (orange, blue, green, purple)
  ↑
  Selected swatch has inner ring glow in its own accent color
```

---

## 7. Motion & Micro-animations

| Event | Animation |
|---|---|
| Sidebar collapse/expand | `width` transition, `200ms ease-out` |
| Page route change | Fade + slight upward slide (`opacity 0→1, translateY 4px→0`) |
| Check-in success | Green glow pulse (`box-shadow` scale, `400ms`) |
| Check-in error | Red glow pulse + subtle shake (`transform: translateX`) |
| Modal/sheet open | Slide in from right, `250ms cubic-bezier(0.32, 0.72, 0, 1)` |
| Badge status change | Color crossfade `200ms` |
| Button hover | Accent glow intensifies `150ms` |
| Table row hover | `bg-muted/60` fade `100ms` |
| Stat card entry | Staggered fade-up on page load |

**Rule:** No animation exceeds `400ms`. No looping animations except intentional loading states.

---

## 8. Responsive Behavior

The app is **website-first, not mobile-first**, but the check-in kiosk must work on a tablet.

| Breakpoint | Behavior |
|---|---|
| `lg+` (1024px+) | Full sidebar (expanded), full data tables |
| `md` (768-1023px) | Sidebar auto-collapses to icon-only. Tables remain but horizontally scrollable |
| `< md` | Not a target — PRD is web-only. Show a "best viewed on desktop" banner if needed |

**Kiosk (`/staff/checkin`) is exempt** — designed for a tablet in portrait/landscape, tested on Android Chrome.

---

## 9. Key UI States to Design

| State | Where | Notes |
|---|---|---|
| Loading skeleton | All data tables | Pulse skeleton rows matching table layout |
| Empty state | Members, Payments, Attendance | Illustrated empty + primary CTA |
| Error state | Any data fetch | Toast + inline error with retry |
| Optimistic update | Status toggles, attendance | Immediate UI update, rollback on error |
| Offline indicator | Check-in kiosk | Amber banner top of screen: "Offline — scans queued" |
| Session expired | All pages | Redirect to login with "Session expired" toast |
