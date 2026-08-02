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
  const [year, setYear] = useState<string>("all");
  const [visible, setVisible] = useState(PAGE);

  const years = useMemo(() => {
    const set = new Set(
      catalog.releases.map((r) => r.releaseYear).filter(Boolean),
    );
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [catalog.releases]);

  const items = useMemo(() => {
    let list =
      filter === "album"
        ? catalog.albums
        : filter === "single"
          ? catalog.singles
          : catalog.releases;
    if (year !== "all") list = list.filter((r) => r.releaseYear === year);
    return list.filter((r) => r.verified);
  }, [catalog, filter, year]);

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
      {years.length > 1 ? (
        <div className={styles.years} role="list" aria-label="Yıl filtresi">
          <button
            type="button"
            className={`${styles.year} ${year === "all" ? styles.yearActive : ""}`}
            onClick={() => {
              setYear("all");
              setVisible(PAGE);
            }}
          >
            TÜMÜ
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              role="listitem"
              className={`${styles.year} ${year === y ? styles.yearActive : ""}`}
              onClick={() => {
                setYear(y);
                setVisible(PAGE);
              }}
            >
              {y}
            </button>
          ))}
        </div>
      ) : null}

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

      <div key={`${filter}-${year}`} className={styles.grid}>
        {shown.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </div>
  );
}
