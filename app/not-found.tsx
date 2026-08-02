import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={`display ${styles.title}`}>BU KATMAN YOK.</h1>
      <Link href="/" className="editorial-link">
        BAŞA DÖN
      </Link>
    </main>
  );
}
