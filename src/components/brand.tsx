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
      className={cn("h-12 w-auto shrink-0 object-contain object-left", className)}
    />
  );
}

/**
 * Card lockup proportion: badge is a compact companion to the wordmark.
 * Mobile uses a shorter mark + tighter chip so the full lockup fits a phone header.
 */
const lockup = {
  sm: {
    markClassName: "h-5 w-auto max-w-[6.75rem] sm:h-6 sm:max-w-none",
    badgeClassName: "h-[14px] px-1.5 text-[7px] tracking-[0.14em] sm:h-[15px] sm:text-[8px] sm:tracking-[0.18em]",
  },
  md: {
    markClassName: "h-6 w-auto max-w-[7.25rem] sm:h-7 sm:max-w-none",
    badgeClassName: "h-[15px] px-1.5 text-[8px] tracking-[0.14em] sm:h-[19px] sm:text-[9px] sm:tracking-[0.18em]",
  },
  lg: {
    markClassName: "h-6 w-auto max-w-[7.25rem] sm:h-8 sm:max-w-none",
    badgeClassName:
      "h-[15px] px-1.5 text-[7.5px] tracking-[0.14em] sm:h-[22px] sm:px-2 sm:text-[10px] sm:tracking-[0.2em]",
  },
} as const;

export function BrandWordmark({
  compact = false,
  href = "/",
  size = "md",
  className,
}: {
  compact?: boolean;
  href?: string;
  size?: keyof typeof lockup;
  className?: string;
}) {
  const scale = compact ? lockup.sm : lockup[size];

  return (
    <Link href={href} className={cn("inline-flex min-w-0 items-center", className)} aria-label="SynteraX Affiliates">
      <span className="inline-flex min-w-0 items-center gap-1.5 sm:gap-2.5">
        <SynteraLogo className={scale.markClassName} priority />
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-md border border-[#1A56E8]/45 bg-[#1A56E8]/12 font-sans font-semibold uppercase leading-none text-[#8FB4FF]",
            scale.badgeClassName,
          )}
        >
          Affiliates
        </span>
      </span>
    </Link>
  );
}
