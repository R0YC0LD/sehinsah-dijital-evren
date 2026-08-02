"use client";

import { createContext, useContext } from "react";
import { useAudioPreview } from "@/hooks/useAudioPreview";

type AudioCtx = ReturnType<typeof useAudioPreview>;

const Ctx = createContext<AudioCtx | null>(null);

export function AudioPreviewProvider({ children }: { children: React.ReactNode }) {
  const value = useAudioPreview();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAudioPreviewContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAudioPreviewContext requires provider");
  return ctx;
}
