import type { MusicCatalog } from "@/lib/spotify/types";
import styles from "./CatalogSummary.module.css";

type Props = {
  catalog: MusicCatalog;
};

export function CatalogSummary({ catalog }: Props) {
  const items = [
    { label: "TOPLAM YAYIN", value: String(catalog.counts.total) },
    { label: "ALBÜM", value: String(catalog.counts.albums) },
    { label: "TEKLİ / EP", value: String(catalog.counts.singles) },
  ];

  return (
    <ul className={styles.row} aria-label="Katalog özeti">
      {items.map((item) => (
        <li key={item.label} className={styles.item}>
          <span className={styles.label}>{item.label}</span>
          <strong className={styles.value}>{item.value}</strong>
        </li>
      ))}
    </ul>
  );
}
