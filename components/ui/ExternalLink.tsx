type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
};

export function ExternalLink({
  href,
  children,
  className,
  "aria-label": ariaLabel,
}: Props) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
