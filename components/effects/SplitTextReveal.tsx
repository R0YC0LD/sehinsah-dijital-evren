"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  mode?: "up" | "scale" | "clip";
};

export function SplitTextReveal({
  text,
  as = "h2",
  className = "",
  mode = "up",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const Tag = as;

  useLayoutEffect(() => {
    if (!ref.current || reduced) return;

    const ctx = gsap.context(() => {
      const chars = ref.current!.querySelectorAll("[data-char]");
      const from =
        mode === "scale"
          ? { opacity: 0, scale: 1.25, y: 0 }
          : mode === "clip"
            ? { opacity: 0, yPercent: 110, rotate: 2 }
            : { opacity: 0, y: 36 };

      gsap.fromTo(
        chars,
        from,
        {
          opacity: 1,
          y: 0,
          yPercent: 0,
          scale: 1,
          rotate: 0,
          duration: 0.9,
          stagger: 0.045,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 85%",
            once: true,
          },
        },
      );
    }, ref);

    return () => ctx.revert();
  }, [reduced, mode, text]);

  return (
    <Tag ref={ref as React.RefObject<HTMLHeadingElement>} className={className}>
      {text.split("").map((char, i) => (
        <span key={`${char}-${i}`} className="split-char-wrap" aria-hidden="true">
          <span data-char>{char === " " ? "\u00A0" : char}</span>
        </span>
      ))}
      <span className="sr-only">{text}</span>
    </Tag>
  );
}
