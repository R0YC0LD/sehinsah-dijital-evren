"use client";

import styles from "./ProductFilters.module.css";

type Props = {
  categories: string[];
  value: string;
  onChange: (value: string) => void;
};

export function ProductFilters({ categories, value, onChange }: Props) {
  if (categories.length < 2) return null;

  return (
    <div className={styles.filters} role="tablist" aria-label="Ürün filtreleri">
      <button
        type="button"
        role="tab"
        aria-selected={value === "all"}
        className={`${styles.tab} ${value === "all" ? styles.active : ""}`}
        onClick={() => onChange("all")}
      >
        TÜMÜ
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          role="tab"
          aria-selected={value === category}
          className={`${styles.tab} ${value === category ? styles.active : ""}`}
          onClick={() => onChange(category)}
        >
          {category.toLocaleUpperCase("tr-TR")}
        </button>
      ))}
    </div>
  );
}
