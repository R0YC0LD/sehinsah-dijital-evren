import type { Metadata, Viewport } from "next";
import { Anton, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PageFadeIn } from "@/components/transition/PageFadeIn";
import { PageTransitionOverlay } from "@/components/transition/PageTransitionOverlay";
import { siteConfig } from "@/data/site";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteUrl,
    type: "website",
    locale: "tr_TR",
    images: [{ url: siteConfig.media.bubilet, width: 960, height: 960 }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.media.bubilet],
  },
  robots: { index: true, follow: true },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: {
      "msvalidate.01": "64510573A2D4986B670085502359BB46",
    },
  },
};

const musicGroupJsonLd = {
  "@context": "https://schema.org",
  "@type": "MusicGroup",
  name: siteConfig.displayName,
  alternateName: [siteConfig.artistName, "Ufuk Yıkılmaz", "HSNSBBH"],
  url: siteUrl,
  image: `${siteUrl}${siteConfig.media.bubilet}`,
  genre: "Hip Hop",
  sameAs: [
    siteConfig.links.spotifyArtist,
    siteConfig.links.appleMusicArtist,
    siteConfig.links.youtube,
    siteConfig.links.tiktok,
    siteConfig.links.instagram,
    "https://tr.wikipedia.org/wiki/%C5%9Eehin%C5%9Fah",
    "https://en.wikipedia.org/wiki/%C5%9Eehin%C5%9Fah",
  ],
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${anton.variable} ${space.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(musicGroupJsonLd) }}
        />
        <PageFadeIn>{children}</PageFadeIn>
        <PageTransitionOverlay />
        <Analytics />
      </body>
    </html>
  );
}
