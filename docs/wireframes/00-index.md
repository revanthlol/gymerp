# GymERP — Wireframe Index

> **Status:** Approved for implementation · v1.0

This folder contains screen-level wireframes for all role portals in the GymERP system.
Each file covers one role group, with annotated ASCII layouts, Mermaid user-flow diagrams,
and component-level interaction notes.

---

## Files

| File | Role / Area | Screens |
|---|---|---|
| [01-shared-login.md](./01-shared-login.md) | Shared (all roles) | Login page |
| [02-platform.md](./02-platform.md) | Platform (Rev's team) | Dashboard, Tenant detail drawer |
| [03-admin.md](./03-admin.md) | Admin (Gym owner) | Dashboard, Members, Plans, Payments |
| [04-staff.md](./04-staff.md) | Staff (Front-desk) | Home, Check-in Kiosk |

---

## Design System Reference

All wireframes conform to the GymERP design system:
- 📄 [`docs/design-system.md`](../design-system.md) — colors, typography, components, motion
- 📄 [`docs/PRD.md`](../PRD.md) — product requirements and scope

---

## Legend

\`\`\`
┌─────┐  Container / panel boundary
│     │  Content area
└─────┘

[Button]      CTA or action button
[Search]      Search input field
[Filter ▾]    Dropdown filter
●             Status dot indicator
→             Navigation / redirect
⊞             Icon placeholder
\`\`\`

---

## Navigation Flow

\`\`\`mermaid
flowchart TD
    A([User visits app]) --> B[Login Page]
    B -->|JWT role = platform| C[Platform Dashboard]
    B -->|JWT role = admin| D[Admin Dashboard]
    B -->|JWT role = staff| E[Staff Home]

    C --> C1[Tenant List]
    C1 --> C2[Tenant Detail Drawer]

    D --> D1[Members Page]
    D --> D2[Plans Page]
    D --> D3[Payments Page]
    D1 --> D1a[Member Detail Sheet]

    E --> E1[Check-in Kiosk]
    E --> E2[Member List]
    E --> E3[Manual Payment]
\`\`\`
