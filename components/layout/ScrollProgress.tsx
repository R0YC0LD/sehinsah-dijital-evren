"use client";

import { useEffect, useState } from "react";
import styles from "./ScrollProgress.module.css";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={styles.rail} aria-hidden="true">
      <div className={styles.track}>
        <div className={styles.fill} style={{ height: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
