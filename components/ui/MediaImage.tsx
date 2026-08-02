"use client";

import { useState } from "react";
import { withBasePath } from "@/lib/paths";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  onErrorFallback?: React.ReactNode;
};

export function MediaImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  onErrorFallback,
}: Props) {
  const [failed, setFailed] = useState(false);
  if (failed && onErrorFallback) return <>{onErrorFallback}</>;
  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={withBasePath(src)}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setFailed(true)}
    />
  );
}
