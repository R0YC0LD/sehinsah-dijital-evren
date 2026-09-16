import { forwardRef } from "react";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
};

export const ExternalLink = forwardRef<HTMLAnchorElement, Props>(function ExternalLink(
  { href, children, className, "aria-label": ariaLabel },
  ref,
) {
  const external = href.startsWith("http");
  return (
    <a
      ref={ref}
      href={href}
      className={className}
      aria-label={ariaLabel}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
});
