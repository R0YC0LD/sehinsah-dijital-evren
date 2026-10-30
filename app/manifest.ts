import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

export const dynamic = "force-static";

/** Ana ekrana eklenebilir uygulama (PWA) tanımı. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${siteConfig.displayName} — Dijital Evren`,
    short_name: siteConfig.displayName,
    description: siteConfig.description,
    lang: "tr",
    dir: "ltr",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#040603",
    theme_color: "#040603",
    categories: ["music", "entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Müzik", short_name: "Müzik", url: "/#muzik", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Konser Takvimi", short_name: "Takvim", url: "/#takvim", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Mağaza", short_name: "Mağaza", url: "/magaza", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
