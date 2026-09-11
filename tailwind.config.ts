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
