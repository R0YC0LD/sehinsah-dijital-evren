import type { NextConfig } from "next";

const deployTarget = (process.env.NEXT_PUBLIC_DEPLOY_TARGET || "vercel").toLowerCase();
const isGitHubPages = deployTarget === "github-pages";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(isGitHubPages
    ? {
        output: "export" as const,
        trailingSlash: true,
        basePath: basePath || undefined,
        assetPrefix: basePath ? `${basePath}/` : undefined,
        images: { unoptimized: true },
      }
    : {
        images: {
          formats: ["image/avif", "image/webp"],
          // Spotify kapakları değişmez; optimize edilmiş halini 30 gün sakla.
          minimumCacheTTL: 60 * 60 * 24 * 30,
          qualities: [75, 80, 92],
          remotePatterns: [
            { protocol: "https", hostname: "i.scdn.co", pathname: "/**" },
            { protocol: "https", hostname: "mosaic.scdn.co", pathname: "/**" },
            { protocol: "https", hostname: "image-cdn-ak.spotifycdn.com", pathname: "/**" },
            { protocol: "https", hostname: "image-cdn-fa.spotifycdn.com", pathname: "/**" },
          ],
        },
        async headers() {
          const cache = (value: string) => [{ key: "Cache-Control", value }];
          return [
            // Dosya adları hash'li olmadığı için 1 hafta + arka planda yenileme.
            {
              source: "/media/:path*",
              headers: cache("public, max-age=604800, stale-while-revalidate=2592000"),
            },
            {
              source: "/sw.js",
              headers: [
                ...cache("public, max-age=0, must-revalidate"),
                { key: "Service-Worker-Allowed", value: "/" },
              ],
            },
            {
              source: "/audio/:path*",
              headers: cache("public, max-age=604800, stale-while-revalidate=2592000"),
            },
          ];
        },
      }),
};

export default nextConfig;
