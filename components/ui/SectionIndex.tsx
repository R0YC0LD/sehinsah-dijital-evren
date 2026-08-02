"use client";

import { sections } from "@/data/site";

type Props = {
  activeId: string;
};

export function SectionIndex({ activeId }: Props) {
  const current =
    sections.find((s) => s.id === activeId) ?? sections[0];

  return (
    <aside className="section-index" aria-hidden="true">
      <strong>{current.index}</strong>
      <span> — {current.label}</span>
    </aside>
  );
}
