import { formatPrice } from "@/lib/store/format";
import { assetPath } from "@/lib/paths/assetPath";
import { siteConfig } from "@/data/site";
import type { Product } from "@/lib/store/types";
import styles from "./ProductCard.module.css";

type Props = {
  product: Product;
  onSelect: (product: Product) => void;
};

export function ProductCard({ product, onSelect }: Props) {
  return (
    <div className={styles.card}>
      <button
        type="button"
        className={styles.link}
        onClick={() => onSelect(product)}
        aria-haspopup="dialog"
        aria-label={`${product.name} ürününü incele`}
      >
        <div className={styles.cover}>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={assetPath(product.images[0])}
              alt={product.name}
              width={640}
              height={640}
              loading="lazy"
              className={styles.image}
            />
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
      </button>
    </div>
  );
}
