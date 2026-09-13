# GymERP — UI Design System & Component Guidelines

GymERP uses an editorial, high-performance UI design system built on top of **shadcn/ui**, **Tailwind CSS 3.4**, and modern frosted glass mechanics.

---

## 1. Design Principles

1. **Light & Dark First**: Full, zero-flicker dual theme support using CSS variable tokens and `next-themes`.
2. **Minimal & Clean (Anti-AI)**: Avoid gratuitous neon glows, excessive rainbow gradients, and heavy drop shadows. Surfaces are restrained and content-focused.
3. **True Frosted Glass (Glassmorphism)**: Inspired by high-end floating interfaces (`leprint`), utilizing low surface opacities, high-pass blur filters, saturation boost, and top specular highlights.
4. **Ergonomic Density**: High information density tailored for busy front-desk staff, coaches, and gym owners without visual fatigue.

---

## 2. Color Tokens & Semantic Architecture

All colors map to CSS variables in `@layer base` within `src/app/globals.css`:

| Semantic Token | Light Mode Value | Dark Mode Value | Usage |
| :--- | :--- | :--- | :--- |
| `background` | `#F9FAFB` | `#090A0F` | Main viewport canvas background |
| `foreground` | `#09090B` | `#F4F4F5` | Primary text and high-contrast labels |
| `card` | `#FFFFFF` | `#111318` | Elevated surfaces, dashboard panels |
| `card-foreground` | `#09090B` | `#F4F4F5` | Headings and text inside card surfaces |
| `border` | `#E4E4E7` (`zinc-200`) | `rgba(255, 255, 255, 0.08)` | Hairline dividers and boundaries |
| `primary` | `#059669` (`emerald-600`) | `#3ECF8E` (`emerald-400`) | Primary CTAs, active states, verified badges |
| `primary-foreground`| `#FFFFFF` | `#08090A` | Text on top of primary buttons |
| `muted` | `#F4F4F5` | `#181A20` | Secondary button backgrounds, table headers |
| `muted-foreground` | `#71717A` | `#A1A1AA` | Supporting metadata, timestamps, captions |
| `destructive` | `#EF4444` | `#EF4444` | Action cancellations, deletion, expired alerts |

---

## 3. Frosted Glass Specification

Rather than flat semi-translucent fills, true frosted glass combines 5 distinct physical optical properties:

```css
/* Tailwind implementation */
bg-white/40 dark:bg-black/40
backdrop-blur-2xl
[backdrop-filter:blur(20px)_saturate(150%)]
border border-zinc-200/70 dark:border-white/[0.1]
shadow-[0_8px_30px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.2)]
dark:shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)]
```

### Why this works:
- **Low Fill Opacity (40%)**: Allows colors beneath to bleed through dynamically.
- **Deep Blur (`20px`)**: Smooths underlying text and shapes into an abstract backdrop.
- **Saturation Multiplier (`150%`)**: Enhances vibrance of passing elements rather than muting them into gray sludge.
- **Top Specular Highlight (`inset 0 1px 0 0 rgba(...)`)**: Simulates light catching the chamfered top edge of a real physical glass slab.

---

## 4. Typography Hierarchy

- **Primary Typeface**: [Inter](https://fonts.google.com/specimen/Inter) — Clean, legible geometric grotesque for all interface headings, buttons, and form labels.
- **Monospace Typeface**: [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — Applied specifically to numeric telemetry, currency amounts, security nonces, time countdowns, and database UUIDs.
- **Rules**:
  - Sentence-case headings only. Avoid uppercase screaming text except on tiny status tags.
  - Generous line height (`leading-relaxed`) on descriptive text.
  - Zero forced global monospace on `<html>` or `<body>`.

---

## 5. Navigation & Layout Shell

- **Floating Navbar**:
  - Height: `h-14` (56px)
  - Geometry: `rounded-2xl` matching sidebar corner radius.
  - Position: Floating `sticky top-3 sm:top-4` with left/right padding.
  - Behavior: Elevates specular shadows on scroll (`isScrolled`).
- **Floating Collapsible Sidebar**:
  - Left pinned `top-4 bottom-4 left-4`.
  - Geometry: `rounded-2xl` with identical radius curvature to navbar.
  - Width: Smooth transition from collapsed `w-16` to expanded `w-56`.
  - Behavior: Expands on hover; pin toggle button locks expanded state into `localStorage`.
