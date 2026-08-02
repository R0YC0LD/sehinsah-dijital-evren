const FALLBACK = "https://sehinsah-dijital-evren.vercel.app";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK;
  try {
    return new URL(raw).origin;
  } catch {
    return FALLBACK;
  }
}
