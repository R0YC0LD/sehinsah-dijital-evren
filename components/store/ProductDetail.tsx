"use client";

import { useState } from "react";
import Link from "next/link";
import { assetPath } from "@/lib/paths/assetPath";
import { formatPrice } from "@/lib/store/format";
import { siteConfig } from "@/data/site";
import type { Product } from "@/lib/store/types";
import { ProductComments } from "@/components/store/ProductComments";
import { ProductRevealImage } from "@/components/store/ProductRevealImage";
import styles from "./ProductDetail.module.css";

type Props = {
  product: Product;
};

export function ProductDetail({ product }: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const image = product.images[activeImage] || product.images[0];

  return (
    <section className={`section-shell ${styles.section}`} aria-label={product.name}>
      <div className={`section-backdrop ${styles.backdrop}`} aria-hidden="true" />

      <div className={`section-content content-wide ${styles.content}`}>
        <Link href="/magaza" className={`editorial-link ${styles.back}`}>
          ← MAĞAZAYA DÖN
        </Link>

        <div className={styles.layout}>
          <div className={styles.gallery}>
            <div className={styles.mainImage}>
              {image ? (
                <ProductRevealImage src={image} alt={product.name} />
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
            <p className="meta-label">{product.category}</p>
            <h1 className={`display ${styles.name}`}>{product.name}</h1>
            <p className={styles.price}>{formatPrice(product.price)}</p>
            <p className={styles.description}>{product.description}</p>

            {product.sizes.length ? (
              <div className={styles.sizes}>
                <span className={styles.sizeLabel}>{siteConfig.store.sizeLabel}</span>
                <div
                  className={styles.sizeRow}
                  role="radiogroup"
                  aria-label={siteConfig.store.sizeLabel}
                >
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

        <ProductComments productId={product.id} />
      </div>
    </section>
  );
}
