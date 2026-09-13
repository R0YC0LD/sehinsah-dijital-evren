"use client";

import { useState } from "react";
import Image from "next/image";
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
    <Image
      src={withBasePath(src)}
      alt={alt}
      width={width}
      height={height}
      className={className}
      quality={92}
      priority={priority}
      unoptimized={src.startsWith("data:") || src.startsWith("blob:")}
      onError={() => setFailed(true)}
    />
  );
}
