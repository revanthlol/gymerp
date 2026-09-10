import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GymERP — Member Kiosk & Management",
    short_name: "GymERP",
    description: "High-performance Gym ERP check-in kiosk, attendance tracking, and multi-tenant management.",
    start_url: "/staff/kiosk",
    display: "standalone",
    orientation: "landscape-primary",
    background_color: "#080809",
    theme_color: "#080809",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
