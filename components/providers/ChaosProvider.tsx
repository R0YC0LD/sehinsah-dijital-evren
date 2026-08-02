"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const STORAGE_KEY = "sehinsah-chaos-mode";

type ChaosContextValue = {
  chaos: boolean;
  pristine: boolean;
  toggle: (value: boolean) => void;
};

const ChaosContext = createContext<ChaosContextValue | null>(null);

export function ChaosProvider({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [chaos, setChaos] = useState(false);
  const [pristine, setPristine] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") setChaos(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.chaos = chaos && !reduced ? "true" : "false";
    try {
      localStorage.setItem(STORAGE_KEY, String(chaos));
    } catch {
      /* ignore */
    }
  }, [chaos, reduced]);

  const toggle = useCallback((value: boolean) => {
    setPristine(false);
    setChaos(value);
  }, []);

  const value = useMemo(
    () => ({ chaos, pristine, toggle }),
    [chaos, pristine, toggle],
  );

  return <ChaosContext.Provider value={value}>{children}</ChaosContext.Provider>;
}

export function useChaos() {
  const ctx = useContext(ChaosContext);
  if (!ctx) throw new Error("useChaos must be used within ChaosProvider");
  return ctx;
}
