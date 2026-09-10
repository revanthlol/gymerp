# Design Specification: Vercel-Inspired Design with NVIDIA Green

Version: 1.0.0
Name: Vercel-Inspired-Nvidia-Green
Description: A precision dark-mode interpretation of Vercel's stark design system paired with iconic NVIDIA green (#76b900) as the high-impact accent, stark obsidian canvases, stacked elevation shadows, and Geist/Inter geometric typography.

## Color Tokens

```yaml
colors:
  primary: "#76b900"            # Iconic NVIDIA Green
  primary-hover: "#6aa600"      # Deepened NVIDIA Green
  on-primary: "#000000"         # Pitch black text on green
  canvas: "#080809"             # Pitch black / deep carbon canvas
  canvas-soft: "#0e0e12"        # Elevated card surface (Vercel dark card)
  canvas-soft-2: "#141418"      # Inset / code / secondary container
  ink: "#f4f4f6"                # High-contrast primary text
  body: "#a1a1aa"               # Secondary descriptive text
  mute: "#71717a"               # Dimmed labels / captions
  hairline: "rgba(255, 255, 255, 0.08)" # Subtle 1px dividers
  hairline-strong: "rgba(255, 255, 255, 0.16)"
  accent-green: "#76b900"       # NVIDIA Green branding
  accent-green-soft: "rgba(118, 185, 0, 0.12)" # Delicate tint
  accent-green-border: "rgba(118, 185, 0, 0.28)"
  success: "#76b900"
  error: "#ef4444"
  error-soft: "rgba(239, 68, 68, 0.12)"
  warning: "#f59e0b"
```

## Typography

- **Headlines**: Geometric Sans (Geist / Inter / system-ui), Weight 600, sentence-case, with negative tracking (`-0.6px` to `-1.2px`).
- **Body**: Weight 400 / 500, clean readable line height (`1.5` to `1.6`).
- **Technical & Captions**: Monospace (Geist Mono / ui-monospace) for timestamps, tokens, IDs, and status pills.

## Elevation & Depth

- **Level 1 (Card Flat)**: `border: 1px solid rgba(255, 255, 255, 0.06); background: rgba(14, 14, 18, 0.85)`
- **Level 2 (Stacked Shadow)**: `box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.04)`
- **Level 3 (Modal / Floating)**: `box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)`
- **Subtle Glow**: Refined 1px hairline border glow in NVIDIA Green (`rgba(118, 185, 0, 0.25)`). No heavy multi-color neon blobs.

## Components & Radii

- **Buttons**:
  - Primary CTA: Pill (`rounded-full` / 100px) or clean 8px (`rounded-xl`), background `#76b900`, text `#000000` font-bold.
  - Secondary: `rounded-xl`, dark surface with hairline border (`hover:border-zinc-700`).
- **Navigation**:
  - Sticky 64px header (`bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80`).
  - Active indicator: Subtle bottom hairline in NVIDIA Green.
