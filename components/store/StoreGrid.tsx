"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductFilters } from "@/components/store/ProductFilters";
import { siteConfig } from "@/data/site";
import type { Product } from "@/lib/store/types";
import styles from "./StoreGrid.module.css";

type Props = {
  products: Product[];
};

export function StoreGrid({ products }: Props) {
  const [filter, setFilter] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products],
  );

  const items = useMemo(
    () => (filter === "all" ? products : products.filter((p) => p.category === filter)),
    [products, filter],
  );

  if (!products.length) {
    return (
      <div className={`panel ${styles.fallback}`}>
        <p className={`display ${styles.fallbackTitle}`}>{siteConfig.store.emptyTitle}</p>
        <p>{siteConfig.store.emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <ProductFilters categories={categories} value={filter} onChange={setFilter} />
      </div>

      <div key={filter} className={styles.grid}>
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
