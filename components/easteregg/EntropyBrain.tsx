"use client";

import { useRef, useState } from "react";
import { entropyConfig } from "@/data/entropy";
import { assetPath } from "@/lib/paths/assetPath";
import type { EntropySlotId } from "@/lib/entropy/types";
import { useEntropy } from "@/components/easteregg/EntropyProvider";
import styles from "./EntropyBrain.module.css";

type Props = {
  id: EntropySlotId;
  className?: string;
};

const SLOT_CLASS: Record<EntropySlotId, string> = {
  "menu-preview-corner": styles["slot-menu-preview-corner"],
  "hero-lower-left": styles["slot-hero-lower-left"],
  "music-heading-edge": styles["slot-music-heading-edge"],
  "discography-divider": styles["slot-discography-divider"],
  "stage-poster-edge": styles["slot-stage-poster-edge"],
  "instagram-ring-side": styles["slot-instagram-ring-side"],
  "final-copy-corner": styles["slot-final-copy-corner"],
  "footer-credit-nearby": styles["slot-footer-credit-nearby"],
};

export function EntropyBrain({ id, className }: Props) {
  const { isSlotVisible, collect } = useEntropy();
  const [collecting, setCollecting] = useState(false);
  const locked = useRef(false);

  if (!isSlotVisible(id) && !collecting) return null;

  const delay = `${(id.length % 7) * 1.3}s`;

  const onClick = () => {
    if (locked.current) return;
    locked.current = true;
    setCollecting(true);
    collect(id);
    window.setTimeout(() => {
      setCollecting(false);
    }, entropyConfig.collectAnimationMs);
  };

  return (
    <button
      type="button"
      className={[
        styles.brain,
        SLOT_CLASS[id],
        collecting ? styles.collecting : "",
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ["--brain-delay" as string]: delay }}
      aria-label="Gizli Entropiyi topla"
      data-analytics="entropy_found"
      data-entropy-id={id}
      onClick={onClick}
    >
      <span className={styles.ring} aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetPath(entropyConfig.iconSrc)}
        alt=""
        aria-hidden="true"
        width={34}
        height={34}
        draggable={false}
      />
    </button>
  );
}
