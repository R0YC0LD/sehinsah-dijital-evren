"use client";

import { useState } from "react";
import styles from "./GlitchText.module.css";

type Props = {
  text: string;
  className?: string;
  as?: "span" | "p" | "h2" | "h3";
};

export function GlitchText({ text, className = "", as = "span" }: Props) {
  const [active, setActive] = useState(false);
  const Tag = as;

  return (
    <Tag
      className={`${styles.glitch} ${active ? styles.active : ""} ${className}`}
      data-text={text}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
    >
      {text}
    </Tag>
  );
}
