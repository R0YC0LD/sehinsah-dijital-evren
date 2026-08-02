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
          remotePatterns: [
            { protocol: "https", hostname: "i.scdn.co", pathname: "/**" },
            { protocol: "https", hostname: "mosaic.scdn.co", pathname: "/**" },
            { protocol: "https", hostname: "image-cdn-ak.spotifycdn.com", pathname: "/**" },
            { protocol: "https", hostname: "image-cdn-fa.spotifycdn.com", pathname: "/**" },
          ],
        },
      }),
};

export default nextConfig;
