"use client";

import styles from "./AlbumFilters.module.css";

export type AlbumFilter = "all" | "album" | "single";

type Props = {
  value: AlbumFilter;
  onChange: (value: AlbumFilter) => void;
};

const options: Array<{ id: AlbumFilter; label: string }> = [
  { id: "all", label: "TÜMÜ" },
  { id: "album", label: "ALBÜMLER" },
  { id: "single", label: "TEKLİLER" },
];

export function AlbumFilters({ value, onChange }: Props) {
  return (
    <div className={styles.filters} role="tablist" aria-label="Albüm filtreleri">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={value === opt.id}
          className={`${styles.tab} ${value === opt.id ? styles.active : ""}`}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
