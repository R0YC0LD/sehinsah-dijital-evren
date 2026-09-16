import { flushSync } from "react-dom";

export function withViewTransition(update: () => void) {
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (typeof document === "undefined" || typeof document.startViewTransition !== "function" || reduced) {
    update();
    return;
  }

  const transition = document.startViewTransition(() => {
    flushSync(update);
  });
  transition.finished.catch(() => {});
}
