import Link from "next/link";
import { BrandWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";

const ticker = [
  "Membership exclusive",
  "Same SynteraX login",
  "Share membership, card, and XFLOW",
  "Paid to your Vault or in XFLOW",
];

export function MarketingHeader({
  primaryHref = "https://synterax.io/signup",
  primaryLabel = "Become an Affiliate",
}: {
  primaryHref?: string;
  primaryLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <BrandWordmark size="lg" />
        <div className="flex items-center gap-2 sm:gap-3">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <a href="/api/auth/login">Sign In with SynteraX</a>
          </Button>
          <Button asChild>
            <a href={primaryHref}>{primaryLabel}</a>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function MarketingTicker() {
  const line = ticker.join("  •  ");
  return (
    <div className="overflow-hidden border-b border-border/60 bg-primary/10 py-2 text-[11px] uppercase tracking-[0.22em] text-primary">
      <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
        <span>{line}</span>
        <span aria-hidden="true">{line}</span>
        <span aria-hidden="true">{line}</span>
      </div>
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <BrandWordmark />
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/marketplace" className="hover:text-foreground">
            What you can promote
          </Link>
          <a href="https://synterax.io" className="hover:text-foreground">
            SynteraX
          </a>
          <a href="https://www.synteraxcard.io" className="hover:text-foreground">
            SynteraX Card
          </a>
        </div>
      </div>
    </footer>
  );
}
