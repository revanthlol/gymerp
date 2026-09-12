import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        // Refined Supabase/Linear Dark Obsidian Palette
        primary: {
          DEFAULT: "#3ecf8e",
          deep: "#24b47e",
          soft: "#4ade80",
          foreground: "#08090a",
        },
        brand: {
          DEFAULT: "#3ecf8e",
          hover: "#24b47e",
          soft: "#4ade80",
          glow: "rgba(62, 207, 142, 0.2)",
        },
        canvas: {
          DEFAULT: "#08090a",
          soft: "#0f1013",
          night: "#121418",
          "night-soft": "#181b20",
        },
        ink: {
          DEFAULT: "#f4f4f5",
          secondary: "#a1a1aa",
          mute: "#71717a",
          "mute-2": "#52525b",
          faint: "#3f3f46",
        },
        hairline: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          strong: "rgba(255, 255, 255, 0.14)",
          cool: "rgba(255, 255, 255, 0.05)",
        },
        carbon: {
          950: "#050506",
          900: "#08090a",
          850: "#0f1013",
          800: "#14161b",
          700: "#1b1e24",
          600: "#272a32",
        },
        // Vibrant Athletic Performance Palette
        energy: {
          DEFAULT: "#f43f5e",
          soft: "#fb7185",
          deep: "#e11d48",
          glow: "rgba(244, 63, 94, 0.25)",
        },
        pulse: {
          DEFAULT: "#6366f1",
          soft: "#818cf8",
          deep: "#4f46e5",
          violet: "#8b5cf6",
          glow: "rgba(99, 102, 241, 0.25)",
        },
        vitality: {
          DEFAULT: "#06b6d4",
          soft: "#22d3ee",
          mint: "#10b981",
          glow: "rgba(6, 182, 212, 0.25)",
        },
        warmth: {
          DEFAULT: "#f59e0b",
          soft: "#fbbf24",
          deep: "#d97706",
        },
      },
      borderRadius: {
        xs: "4px",
        sm: "6px", // Supabase signature button radius
        md: "8px",
        lg: "12px", // Supabase signature card radius
        xl: "16px",
      },
    },
  },
  plugins: [],
};
export default config;
