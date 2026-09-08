# Wireframe: Login Page (Shared — All Roles)

> **Route:** `/login`  
> **Roles:** Platform · Admin · Staff  
> **Auth:** Supabase Auth — role detected from JWT, auto-redirects post-login

---

## User Flow

```mermaid
flowchart TD
    A([User opens app]) --> B{Is session active?}
    B -->|Yes| C{JWT role?}
    B -->|No| D[Login Page]
    C -->|platform| E[/platform]
    C -->|admin| F[/admin]
    C -->|staff| G[/staff]
    D --> H[Enter email + password]
    H --> I[Sign In]
    I --> J{Auth success?}
    J -->|No| K[Inline error message]
    K --> H
    J -->|Yes| C
```

---

## Screen Layout

```
┌──────────────────────────────────────────────────────┐
│  bg: #0A0A0A                                         │
│                                                      │
│        [subtle radial glow behind card               │
│         accent color, ~5% opacity]                   │
│                                                      │
│         ┌────────────────────────────────┐           │
│         │  ⊞  GymERP                    │  ← Logo   │
│         │     [wordmark + dumbbell icon] │           │
│         │                               │           │
│         │  ─────────────────────────    │           │
│         │                               │           │
│         │  Email                        │           │
│         │  ┌─────────────────────────┐  │           │
│         │  │ name@example.com        │  │           │
│         │  └─────────────────────────┘  │           │
│         │                               │           │
│         │  Password                     │           │
│         │  ┌───────────────────────[👁]┐ │           │
│         │  │ ••••••••                  │ │           │
│         │  └───────────────────────────┘ │           │
│         │                               │           │
│         │  ┌─────────────────────────┐  │           │
│         │  │  Sign In  →             │  │ ← Accent  │
│         │  └─────────────────────────┘  │   button  │
│         │                               │           │
│         │  [Error: Invalid credentials] │ ← inline  │
│         └────────────────────────────────┘           │
│                    max-w-sm, centered                │
└──────────────────────────────────────────────────────┘
```

---

## Component Notes

| Element | Spec |
|---|---|
| **Card** | `bg: rgba(17,17,19,0.85)`, `backdrop-filter: blur(8px)`, `border: 1px solid rgba(255,255,255,0.08)`, `border-radius: 10px`, inner accent glow |
| **Logo** | Wordmark `Inter 700`, dumbbell SVG icon, `text-primary` |
| **Email input** | `h-9`, `bg-muted`, `border border-strong`, `text-body`, focus → accent border + glow |
| **Password input** | Same as email + eye toggle icon (ghost icon button, right-aligned) |
| **Sign In button** | Full-width, `bg: --accent`, `text-accent-foreground`, hover → accent glow intensifies `150ms` |
| **Error state** | Inline below button, `text-red-400 text-caption`, fade in |
| **Background** | `bg-base #0A0A0A` + radial gradient glow centered at card position, 5% accent opacity |

---

## States

| State | Behavior |
|---|---|
| **Default** | Clean form, no errors shown |
| **Loading** | Button shows spinner, disabled |
| **Error** | Inline error message fades in below button, fields keep values |
| **Success** | Brief flash → redirect to role-appropriate dashboard |

---

## Accessibility

- `autoFocus` on email field on page load
- Password field: `type="password"` with toggle to `type="text"` via eye icon
- Sign In button: `type="submit"` within `<form>` — supports Enter key
- Error message: `role="alert"` for screen readers
