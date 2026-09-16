"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/store/format";
import { siteConfig } from "@/data/site";
import { ProductRevealImage } from "@/components/store/ProductRevealImage";
import type { Product } from "@/lib/store/types";
import styles from "./ProductCard.module.css";

type Props = {
  product: Product;
  onOpen: () => void;
};

export function ProductCard({ product, onOpen }: Props) {
  const href = `/magaza/${product.id}`;

  return (
    <div className={styles.card}>
      <Link
        href={href}
        className={styles.link}
        aria-label={`${product.name} ürününü incele`}
        onClick={(e) => {
          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          onOpen();
        }}
      >
        <div className={styles.cover}>
          {product.images[0] ? (
            <ProductRevealImage src={product.images[0]} alt={product.name} />
          ) : (
            <div className={styles.placeholder}>Görsel bulunamadı</div>
          )}
          {!product.inStock ? (
            <span className={styles.badge}>{siteConfig.store.outOfStock}</span>
          ) : null}
        </div>
        <p className={styles.name}>{product.name}</p>
        <p className={styles.meta}>
          <span>{product.category}</span>
          <span className={styles.price}>{formatPrice(product.price)}</span>
        </p>
      </Link>
    </div>
  );
}
