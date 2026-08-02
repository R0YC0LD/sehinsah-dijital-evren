"use client";

import { useMemo, useState } from "react";
import { AlbumCard } from "@/components/music/AlbumCard";
import { AlbumFilters, type AlbumFilter } from "@/components/music/AlbumFilters";
import { siteConfig } from "@/data/site";
import type { MusicCatalog } from "@/lib/spotify/types";
import { ExternalLink } from "@/components/ui/ExternalLink";
import styles from "./AlbumGrid.module.css";

const PAGE = 12;

type Props = {
  catalog: MusicCatalog;
};

export function AlbumGrid({ catalog }: Props) {
  const [filter, setFilter] = useState<AlbumFilter>("all");
  const [visible, setVisible] = useState(PAGE);

  const items = useMemo(() => {
    if (filter === "album") return catalog.albums;
    if (filter === "single") return catalog.singles;
    return catalog.releases;
  }, [catalog, filter]);

  if (!catalog.releases.length) {
    return (
      <div className={`panel ${styles.fallback}`}>
        <p className={`display ${styles.fallbackTitle}`}>{siteConfig.music.fallbackTitle}</p>
        <p>{siteConfig.music.fallbackMessage}</p>
        <ExternalLink href={siteConfig.links.spotifyArtist} className={styles.fallbackCta}>
          {siteConfig.music.fallbackCta}
        </ExternalLink>
      </div>
    );
  }

  const shown = items.slice(0, visible);

  return (
    <div>
      <div className={styles.toolbar}>
        <AlbumFilters
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setVisible(PAGE);
          }}
        />
        {items.length > visible ? (
          <button
            type="button"
            className={styles.more}
            onClick={() => setVisible((n) => n + PAGE)}
          >
            DAHA FAZLA GÖSTER
          </button>
        ) : null}
      </div>

      <div key={filter} className={styles.grid}>
        {shown.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </div>
  );
}
