export type AttributionModel = "first_click" | "last_click" | "linear";

export type PartnerRates = {
  cpaAmountUsd: number;
  cpcAmountUsd: number;
  revsharePct: number;
};

export type PartnerTier = {
  cpaMultiplier?: number | null;
  revshareBonusPct?: number | null;
};

export function applyPartnerRates(
  base: PartnerRates,
  override?: Partial<PartnerRates> | null,
  tier?: PartnerTier | null,
): PartnerRates {
  if (override && (override.cpaAmountUsd != null || override.cpcAmountUsd != null || override.revsharePct != null)) {
    return {
      cpaAmountUsd: override.cpaAmountUsd ?? base.cpaAmountUsd,
      cpcAmountUsd: override.cpcAmountUsd ?? base.cpcAmountUsd,
      revsharePct: override.revsharePct ?? base.revsharePct,
    };
  }
  return {
    cpaAmountUsd: roundMoney(base.cpaAmountUsd * (Number(tier?.cpaMultiplier) || 1)),
    cpcAmountUsd: roundMoney(base.cpcAmountUsd * (Number(tier?.cpaMultiplier) || 1)),
    revsharePct: Number(base.revsharePct || 0) + Number(tier?.revshareBonusPct || 0),
  };
}

export function pickAttributedClick<T extends { created_at: string; click_id: string }>(
  clicks: T[],
  model: AttributionModel,
): T[] {
  if (!clicks.length) return [];
  const sorted = [...clicks].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  if (model === "first_click") return [sorted[0]];
  if (model === "last_click") return [sorted[sorted.length - 1]];
  return sorted;
}

export function splitLinearCommission(total: number, n: number): number[] {
  if (n <= 0) return [];
  const cents = Math.round((Number(total) || 0) * 100);
  const base = Math.floor(cents / n);
  const rem = cents % n;
  return Array.from({ length: n }, (_, i) => (base + (i < rem ? 1 : 0)) / 100);
}

export function expandPostbackMacros(
  template: string,
  vars: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{([a-z0-9_]+)\}/gi, (_, key: string) => {
    const direct = vars[key] ?? vars[key.toLowerCase()];
    return direct == null ? "" : String(direct);
  });
}

export function bakeCreative(
  body: string,
  vars: { link: string; ref: string; offer: string; utmLink: string },
): string {
  const hasPlaceholder = /\{\{(link|ref|offer|utm)\}\}/.test(body);
  let out = body
    .replaceAll("{{link}}", vars.link)
    .replaceAll("{{ref}}", vars.ref)
    .replaceAll("{{offer}}", vars.offer)
    .replaceAll("{{utm}}", vars.utmLink);
  if (!hasPlaceholder && vars.link && !out.includes(vars.link)) {
    out = `${out.trim()}\n\n${vars.link}`;
  }
  return out;
}

export function utmTrackingLink(base: string, offer: string, ref: string): string {
  const url = new URL(base);
  url.searchParams.set("utm_source", "affiliate");
  url.searchParams.set("utm_medium", "cpa");
  url.searchParams.set("utm_campaign", offer);
  url.searchParams.set("utm_content", ref);
  return url.toString();
}

export function qrImageUrl(data: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

export function parseCsvList(value: string | null | undefined): string[] | null {
  const items = String(value || "")
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : null;
}

export function holdRemainingHours(heldUntil: string | null | undefined, status: string): number | null {
  if (status !== "pending" || !heldUntil) return null;
  const ms = +new Date(heldUntil) - Date.now();
  return Math.ceil(ms / 36e5);
}

export function holdLabel(heldUntil: string | null | undefined, status: string): string {
  if (status !== "pending") return status;
  const hours = holdRemainingHours(heldUntil, status);
  if (hours == null) return "pending review";
  if (hours <= 0) return "hold expired";
  if (hours < 24) return `hold ${hours}h`;
  return `hold ${Math.ceil(hours / 24)}d`;
}

export function visitorCookieValue(existing?: string | null): string {
  if (existing && /^[a-f0-9]{16,64}$/i.test(existing)) return existing;
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function blockedReasonCopy(reason: string): string {
  switch (reason) {
    case "geo":
      return "This page is not available in your country. You can still try another SynteraX page.";
    case "device":
      return "This page is not available on this device. Open it on a phone or computer instead.";
    case "daily_cap":
      return "This page is full for today. Try again tomorrow, or open another SynteraX page.";
    case "conversion_cap":
      return "This page has reached its limit. Try another SynteraX page.";
    case "click_cap":
      return "This page is too busy right now. Try another SynteraX page.";
    case "access":
      return "This page is invite-only right now. Try another SynteraX page.";
    default:
      return "This page is not available right now. Try another SynteraX page.";
  }
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
