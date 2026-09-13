import Link from "next/link";
import { formatPrice } from "@/lib/store/format";
import { siteConfig } from "@/data/site";
import { ProductRevealImage } from "@/components/store/ProductRevealImage";
import type { Product } from "@/lib/store/types";
import styles from "./ProductCard.module.css";

type Props = {
  product: Product;
};

export function ProductCard({ product }: Props) {
  return (
    <div className={styles.card}>
      <Link
        href={`/magaza/${product.id}`}
        className={styles.link}
        aria-label={`${product.name} ürününü incele`}
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
