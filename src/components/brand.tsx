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
 * Card lockup proportion: badge is ~80% of the wordmark box, small
 * semibold caps, wide tracking, tight vertical padding.
 */
const lockup = {
  sm: {
    markClassName: "h-6 w-auto",
    badgeClassName: "h-[15px] px-1.5 text-[8px] tracking-[0.18em]",
  },
  md: {
    markClassName: "h-7 w-auto",
    badgeClassName: "h-[19px] px-1.5 text-[9px] tracking-[0.18em]",
  },
  lg: {
    markClassName: "h-8 w-auto",
    badgeClassName: "h-[22px] px-2 text-[10px] tracking-[0.2em]",
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
      <span className="inline-flex items-center gap-2 sm:gap-2.5">
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
