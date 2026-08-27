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
    logo: "h-7",
    badge: "h-[22px] px-2.5 text-[8.5px] tracking-[0.2em]",
  },
  md: {
    logo: "h-7",
    badge: "h-[22px] px-2 text-[8px] tracking-[0.18em]",
  },
  lg: {
    logo: "h-11",
    badge: "h-7 px-3 text-[10.5px] tracking-[0.22em]",
  },
} as const;

export function BrandWordmark({
  compact = false,
  href = "/",
  size = "md",
}: {
  compact?: boolean;
  href?: string;
  size?: "sm" | "md" | "lg";
}) {
  const scale = compact ? lockup.sm : lockup[size];

  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="SynteraX Affiliates">
      <SynteraLogo className={scale.logo} priority />
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border font-normal uppercase text-[#C5D2F2]",
          "border-[#3D6FE0]/50 bg-[#0A1226] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
          scale.badge,
        )}
      >
        Affiliates
      </span>
    </Link>
  );
}
