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
        // Supabase Design MD Palette
        primary: {
          DEFAULT: "#3ecf8e",
          deep: "#24b47e",
          soft: "#4ade80",
          foreground: "#171717", // On-primary is near-black, not white
        },
        brand: {
          DEFAULT: "#3ecf8e",
          hover: "#24b47e",
          soft: "#4ade80",
          glow: "rgba(62, 207, 142, 0.25)",
        },
        canvas: {
          DEFAULT: "#171717",
          soft: "#202020",
          night: "#1c1c1c",
          "night-soft": "#242424",
        },
        ink: {
          DEFAULT: "#171717",
          secondary: "#212121",
          mute: "#707070",
          "mute-2": "#9a9a9a",
          faint: "#b2b2b2",
        },
        hairline: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          strong: "rgba(255, 255, 255, 0.15)",
          cool: "rgba(255, 255, 255, 0.05)",
        },
        carbon: {
          950: "#121212",
          900: "#171717",
          850: "#1c1c1c",
          800: "#202020",
          700: "#2a2a2a",
          600: "#333333",
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
