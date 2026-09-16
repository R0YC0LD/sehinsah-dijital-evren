"use client";

import { useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/store/format";
import { siteConfig } from "@/data/site";
import { ProductRevealImage } from "@/components/store/ProductRevealImage";
import type { Product } from "@/lib/store/types";
import styles from "./ProductQuickView.module.css";

type Props = {
  product: Product;
  onClose: () => void;
};

export function ProductQuickView({ product, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label="Kapat">
          ✕
        </button>

        <div className={styles.cover} style={{ viewTransitionName: `product-cover-${product.id}` }}>
          {product.images[0] ? (
            <ProductRevealImage src={product.images[0]} alt={product.name} />
          ) : (
            <div className={styles.placeholder}>Görsel bulunamadı</div>
          )}
          {!product.inStock ? (
            <span className={styles.badge}>{siteConfig.store.outOfStock}</span>
          ) : null}
        </div>

        <div className={styles.info}>
          <p className="meta-label">{product.category}</p>
          <h3 className={`display ${styles.name}`}>{product.name}</h3>
          <p className={styles.price}>{formatPrice(product.price)}</p>
          <p className={styles.description}>{product.description}</p>
          <Link href={`/magaza/${product.id}`} className={`editorial-link ${styles.cta}`}>
            ÜRÜNÜ İNCELE →
          </Link>
        </div>
      </div>
    </div>
  );
}
