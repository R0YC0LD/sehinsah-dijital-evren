"use client";

import { useEffect, useId, useRef, useState } from "react";
import { assetPath } from "@/lib/paths/assetPath";
import { formatPrice } from "@/lib/store/format";
import { siteConfig } from "@/data/site";
import type { Product } from "@/lib/store/types";
import styles from "./ProductModal.module.css";

type Props = {
  product: Product;
  onClose: () => void;
};

export function ProductModal({ product, onClose }: Props) {
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const image = product.images[activeImage] || product.images[0];

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.panel}>
        <button
          ref={closeRef}
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label={siteConfig.store.closeLabel}
        >
          ✕
        </button>

        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetPath(image)} alt={product.name} className={styles.image} />
            ) : (
              <div className={styles.placeholder}>Görsel bulunamadı</div>
            )}
          </div>
          {product.images.length > 1 ? (
            <div className={styles.thumbs}>
              {product.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={`${styles.thumb} ${i === activeImage ? styles.thumbActive : ""}`}
                  onClick={() => setActiveImage(i)}
                  aria-label={`${product.name} görsel ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetPath(src)} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.info}>
          <p className={styles.category}>{product.category}</p>
          <h2 id={titleId} className={`display ${styles.name}`}>
            {product.name}
          </h2>
          <p className={styles.price}>{formatPrice(product.price)}</p>
          <p id={descId} className={styles.description}>
            {product.description}
          </p>

          {product.sizes.length ? (
            <div className={styles.sizes}>
              <span className={styles.sizeLabel}>{siteConfig.store.sizeLabel}</span>
              <div className={styles.sizeRow} role="radiogroup" aria-label={siteConfig.store.sizeLabel}>
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    role="radio"
                    aria-checked={selectedSize === size}
                    className={`${styles.size} ${selectedSize === size ? styles.sizeActive : ""}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {!product.inStock ? <p className={styles.outOfStock}>{siteConfig.store.outOfStock}</p> : null}
        </div>
      </div>
    </div>
  );
}
