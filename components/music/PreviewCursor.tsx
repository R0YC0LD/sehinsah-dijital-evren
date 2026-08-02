"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./PreviewCursor.module.css";

type Props = {
  rootRef: React.RefObject<HTMLElement | null>;
  enabled: boolean;
};

export function PreviewCursor({ rootRef, enabled }: Props) {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const cursor = cursorRef.current;
    if (!root || !cursor) return;

    const xTo = gsap.quickTo(cursor, "x", { duration: 0.2, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.2, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      const over = (e.target as HTMLElement | null)?.closest("li");
      cursor.dataset.visible = over ? "true" : "false";
      cursor.textContent = enabled ? "DİNLE" : "SESİ AÇ";
    };

    const onLeave = () => {
      cursor.dataset.visible = "false";
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [rootRef, enabled]);

  return <div ref={cursorRef} className={styles.cursor} aria-hidden="true" />;
}
