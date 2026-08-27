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

const lockup = {
  sm: {
    markClassName: "h-4 w-auto max-w-[6.5rem] sm:h-6 sm:max-w-none",
    badgeClassName: "text-[8px] tracking-[0.18em] sm:text-[10px] sm:tracking-[0.24em]",
  },
  md: {
    markClassName: "h-5 w-auto max-w-[8rem] sm:h-6 sm:max-w-none",
    badgeClassName: "",
  },
  lg: {
    markClassName: "h-4 w-auto max-w-[6.5rem] sm:h-6 sm:max-w-none",
    badgeClassName: "text-[8px] tracking-[0.18em] sm:text-[10px] sm:tracking-[0.24em]",
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
      <span className="inline-flex min-w-0 items-center gap-2 sm:gap-2.5">
        <SynteraLogo className={scale.markClassName} priority />
        <span
          className={cn(
            "shrink-0 rounded-md border border-[#1A56E8]/45 bg-[#1A56E8]/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8FB4FF]",
            scale.badgeClassName,
          )}
        >
          Affiliates
        </span>
      </span>
    </Link>
  );
}
