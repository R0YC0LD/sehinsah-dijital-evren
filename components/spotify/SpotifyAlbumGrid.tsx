"use client";

import { useMemo, useState } from "react";
import { SpotifyAlbumCard } from "@/components/spotify/SpotifyAlbumCard";
import {
  SpotifyAlbumFilters,
  type AlbumFilter,
} from "@/components/spotify/SpotifyAlbumFilters";
import type { NormalizedAlbum } from "@/lib/spotify/types";
import styles from "./SpotifyAlbumGrid.module.css";

type Props = {
  albums: NormalizedAlbum[];
  singles: NormalizedAlbum[];
};

export function SpotifyAlbumGrid({ albums, singles }: Props) {
  const [filter, setFilter] = useState<AlbumFilter>("all");

  const items = useMemo(() => {
    if (filter === "album") return albums;
    if (filter === "single") return singles;
    return [...albums, ...singles].sort((a, b) =>
      a.releaseDate < b.releaseDate ? 1 : -1,
    );
  }, [albums, singles, filter]);

  return (
    <div>
      <SpotifyAlbumFilters value={filter} onChange={setFilter} />
      <div key={filter} className={styles.grid}>
        {items.map((album) => (
          <SpotifyAlbumCard key={album.id} album={album} />
        ))}
      </div>
    </div>
  );
}
