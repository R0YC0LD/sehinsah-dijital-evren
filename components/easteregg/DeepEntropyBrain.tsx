"use client";

import { useRef, useState } from "react";
import { useDeepEntropy } from "@/components/easteregg/DeepEntropyProvider";
import { entropyConfig } from "@/data/entropy";
import type { DeepPlacement } from "@/lib/entropy/deep";
import { assetPath } from "@/lib/paths/assetPath";
import brainStyles from "./EntropyBrain.module.css";
import positions from "./DeepEntropyBrain.module.css";

type Props = {
  releaseId: string;
  placement: DeepPlacement;
};

/**
 * Parça sayfasındaki gizli "Derin Entropi" beyni. Yalnızca 1. seviye tamamlandıysa ve bu kullanıcı
 * için bu yayında, bu konumda bir beyin varsa çizilir (aynı kullanıcı hep aynı yerde görür).
 */
export function DeepEntropyBrain({ releaseId, placement }: Props) {
  const { brainFor, collect } = useDeepEntropy();
  const [collecting, setCollecting] = useState(false);
  const locked = useRef(false);

  if (brainFor(releaseId) !== placement && !collecting) return null;

  const onClick = () => {
    if (locked.current) return;
    locked.current = true;
    setCollecting(true);
    collect(releaseId);
    window.setTimeout(() => setCollecting(false), entropyConfig.collectAnimationMs);
  };

  return (
    <button
      type="button"
      className={[brainStyles.brain, positions[placement], collecting ? brainStyles.collecting : ""].filter(Boolean).join(" ")}
      aria-label="Gizli Derin Entropiyi topla"
      data-analytics="entropy_deep_found"
      onClick={onClick}
    >
      <span className={brainStyles.ring} aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={assetPath(entropyConfig.iconSrc)} alt="" aria-hidden="true" width={34} height={34} draggable={false} />
    </button>
  );
}
