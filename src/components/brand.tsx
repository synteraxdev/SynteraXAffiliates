import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoVariant = "light" | "dark";

const logoSrc: Record<LogoVariant, string> = {
  light: "/logo-light.png",
  dark: "/logo-white-theme.png",
};

export function SynteraLogo({
  className,
  variant = "light",
  priority = false,
}: {
  className?: string;
  variant?: LogoVariant;
  priority?: boolean;
}) {
  return (
    <Image
      src={logoSrc[variant]}
      alt="SynteraX"
      width={731}
      height={185}
      priority={priority}
      className={cn("h-12 w-auto shrink-0 object-contain", className)}
    />
  );
}

export function BrandWordmark({
  compact = false,
  href = "/",
  size = "md",
}: {
  compact?: boolean;
  href?: string;
  size?: "sm" | "md" | "lg";
}) {
  const height = compact || size === "sm" ? "h-7" : size === "lg" ? "h-12" : "h-9";

  return (
    <Link href={href} className="inline-flex flex-col items-start gap-0.5">
      <SynteraLogo className={height} priority />
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Affiliates</span>
    </Link>
  );
}
