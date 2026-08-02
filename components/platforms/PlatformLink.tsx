import { BrandIcon, type PlatformIconName } from "@/components/platforms/BrandIcon";
import styles from "./PlatformLinks.module.css";

export type PlatformLinkItem = {
  id: string;
  label: string;
  href: string;
  icon: PlatformIconName;
  analyticsEvent?: string;
};

type Props = {
  item: PlatformLinkItem;
  showLabel?: boolean;
  placement?: string;
};

export function PlatformLink({ item, showLabel = false, placement = "menu" }: Props) {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
      aria-label={`Şehinşah ${item.label} profilini yeni sekmede aç`}
      data-platform={item.id}
      data-placement={placement}
      data-analytics={item.analyticsEvent || ""}
    >
      <BrandIcon name={item.icon} className={styles.icon} />
      {showLabel ? <span className={styles.label}>{item.label}</span> : null}
    </a>
  );
}
