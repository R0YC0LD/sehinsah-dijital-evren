import type { NextConfig } from "next";

const isExport = process.env.NEXT_OUTPUT === "export";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(isExport
    ? {
        output: "export" as const,
        trailingSlash: true,
        images: { unoptimized: true },
        basePath: basePath || undefined,
        assetPrefix: basePath ? `${basePath}/` : undefined,
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
