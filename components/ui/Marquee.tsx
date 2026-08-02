"use client";

import styles from "./Marquee.module.css";

type Props = {
  text: string;
  reverse?: boolean;
  speed?: "slow" | "normal" | "fast";
  className?: string;
};

export function Marquee({
  text,
  reverse = false,
  speed = "normal",
  className = "",
}: Props) {
  const content = `${text}  •  ${text}  •  ${text}  •  `;

  return (
    <div
      className={`${styles.marquee} ${styles[speed]} ${reverse ? styles.reverse : ""} ${className}`}
      aria-hidden="true"
    >
      <div className={styles.track}>
        <span>{content}</span>
        <span>{content}</span>
      </div>
    </div>
  );
}
