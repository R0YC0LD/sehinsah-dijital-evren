import {
  siApplemusic,
  siInstagram,
  siSpotify,
  siTiktok,
  siYoutube,
} from "simple-icons";

export type PlatformIconName =
  | "spotify"
  | "appleMusic"
  | "youtube"
  | "tiktok"
  | "instagram";

const icons: Record<PlatformIconName, { path: string; hex: string; title: string }> = {
  spotify: { path: siSpotify.path, hex: siSpotify.hex, title: siSpotify.title },
  appleMusic: { path: siApplemusic.path, hex: siApplemusic.hex, title: siApplemusic.title },
  youtube: { path: siYoutube.path, hex: siYoutube.hex, title: siYoutube.title },
  tiktok: { path: siTiktok.path, hex: siTiktok.hex, title: siTiktok.title },
  instagram: { path: siInstagram.path, hex: siInstagram.hex, title: siInstagram.title },
};

type Props = {
  name: PlatformIconName;
  size?: number;
  className?: string;
};

export function BrandIcon({ name, size = 20, className }: Props) {
  const icon = icons[name];
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      data-brand={name}
      data-brand-hex={`#${icon.hex}`}
    >
      <title>{icon.title}</title>
      <path d={icon.path} fill="currentColor" />
    </svg>
  );
}

export function getBrandHex(name: PlatformIconName): string {
  return `#${icons[name].hex}`;
}
