"use client";

import { useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { shareOrCopy } from "@/lib/share";
import styles from "./ReleaseActions.module.css";

type Props = {
  id: string;
  type: "album" | "track";
  name: string;
  spotifyUrl: string;
};

export function ReleaseActions({ id, type, name, spotifyUrl }: Props) {
  const { has, toggle } = useFavorites();
  const [note, setNote] = useState("");
  const saved = has(id);

  return (
    <div className={styles.row}>
      <button
        type="button"
        className={styles.btn}
        aria-pressed={saved}
        onClick={() => toggle({ id, type, name, spotifyUrl })}
      >
        {saved ? "KAYITLI" : "+ KAYDET"}
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={async () => {
          const result = await shareOrCopy(spotifyUrl, name);
          if (result === "copied") {
            setNote("BAĞLANTI KOPYALANDI");
            window.setTimeout(() => setNote(""), 1600);
          }
        }}
      >
        PAYLAŞ
      </button>
      {note ? <span className={styles.note} aria-live="polite">{note}</span> : null}
    </div>
  );
}
