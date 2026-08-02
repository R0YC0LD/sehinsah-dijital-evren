"use client";

import { useMemo } from "react";
import styles from "./FeatherField.module.css";

type Props = {
  count?: number;
  className?: string;
};

export function FeatherField({ count = 10, className = "" }: Props) {
  const feathers = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${8 + ((i * 17) % 84)}%`,
        top: `${6 + ((i * 23) % 78)}%`,
        rotate: -40 + ((i * 31) % 80),
        scale: 0.45 + (i % 5) * 0.12,
        delay: (i % 7) * 0.15,
        duration: 7 + (i % 5) * 1.4,
        drift: i % 2 === 0 ? "up" : "down",
      })),
    [count],
  );

  return (
    <div className={`${styles.field} ${className}`} aria-hidden="true">
      {feathers.map((f) => (
        <span
          key={f.id}
          className={`${styles.feather} ${styles[f.drift]}`}
          style={
            {
              left: f.left,
              top: f.top,
              "--r": `${f.rotate}deg`,
              "--s": f.scale,
              "--delay": `${f.delay}s`,
              "--dur": `${f.duration}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
