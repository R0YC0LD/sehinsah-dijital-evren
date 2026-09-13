import { Footer } from "@/components/layout/Footer";
import styles from "./FinalSection.module.css";

export function FinalSection() {
  return (
    <section id="final" className={`section-shell ${styles.section}`} aria-label="Final">
      <div className={`section-backdrop ${styles.backdrop}`} aria-hidden="true" />
      <div className="section-content">
        <Footer />
      </div>
    </section>
  );
}
