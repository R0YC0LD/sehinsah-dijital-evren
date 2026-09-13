"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PAGE_REVEAL_EVENT } from "@/lib/transitionEvents";
import styles from "./PageFadeIn.module.css";

const SAFETY_MS = 2600;

export function PageFadeIn({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [revealed, setRevealed] = useState(true);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    if (reduced) return;

    setRevealed(false);

    const onReveal = () => setRevealed(true);
    window.addEventListener(PAGE_REVEAL_EVENT, onReveal, { once: true });
    const safety = window.setTimeout(() => setRevealed(true), SAFETY_MS);

    return () => {
      window.removeEventListener(PAGE_REVEAL_EVENT, onReveal);
      window.clearTimeout(safety);
    };
  }, [pathname, reduced]);

  return <div className={`${styles.wrap} ${revealed ? styles.revealed : ""}`}>{children}</div>;
}
