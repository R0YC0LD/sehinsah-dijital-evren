import styles from "./NoiseOverlay.module.css";

export function NoiseOverlay() {
  return <div className={`noise-overlay ${styles.root}`} aria-hidden="true" />;
}
