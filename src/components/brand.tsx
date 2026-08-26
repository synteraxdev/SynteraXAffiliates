import { cn } from "@/lib/utils";

export function SynteraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={cn("text-primary", className)} fill="currentColor" aria-hidden>
      <path d="M140 90 L220 170 L256 206 L292 170 L372 90 L410 90 L292 208 L256 244 L220 208 L102 90 Z" />
      <path d="M140 422 L220 342 L256 306 L292 342 L372 422 L410 422 L292 304 L256 268 L220 304 L102 422 Z" />
      <circle cx="256" cy="256" r="24" />
    </svg>
  );
}

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <SynteraMark className="h-7 w-7" />
      <div className="leading-tight">
        <p className="font-heading text-sm font-semibold tracking-wide">SynteraX</p>
        {!compact && <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Affiliates</p>}
      </div>
    </div>
  );
}
