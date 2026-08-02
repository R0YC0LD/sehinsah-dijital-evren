import { withBasePath } from "@/lib/paths";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
  "data-cursor"?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export function ExternalLink({
  href,
  children,
  className,
  "aria-label": ariaLabel,
  "data-cursor": dataCursor,
  onClick,
}: Props) {
  const isExternal = href.startsWith("http");
  const resolved = isExternal ? href : withBasePath(href);

  return (
    <a
      href={resolved}
      className={className}
      aria-label={ariaLabel}
      data-cursor={dataCursor}
      onClick={onClick}
      {...(isExternal
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {children}
    </a>
  );
}
