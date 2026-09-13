import { EntropyBrain } from "@/components/easteregg/EntropyBrain";
import { StoreGrid } from "@/components/store/StoreGrid";
import { products } from "@/data/products";
import { siteConfig } from "@/data/site";
import styles from "./StoreSection.module.css";

export function StoreSection() {
  return (
    <section id="magaza" className={`section-shell ${styles.section}`} aria-label="Mağaza">
      <div className={`section-backdrop ${styles.backdrop}`} aria-hidden="true">
        <span className={`display ${styles.ghost}`}>MAĞAZA</span>
      </div>

      <div className={`section-content ${styles.content}`}>
        <div className={styles.header}>
          <p className="meta-label">{siteConfig.store.meta}</p>
          <h2 className={`display ${styles.title}`}>{siteConfig.store.title}</h2>
          <p className={styles.subtitle}>{siteConfig.store.subtitle}</p>
          <EntropyBrain id="store-grid-edge" />
        </div>

        <StoreGrid products={products} />
      </div>
    </section>
  );
}
