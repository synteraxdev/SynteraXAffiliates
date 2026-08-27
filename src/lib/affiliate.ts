export type PayoutModel = "none" | "cpa" | "cpc" | "cpl" | "revshare" | "hybrid";
export type DestinationKind = "internal" | "external" | "sso_card";
export type LinkStyle = "query" | "path" | "none";
export type ConversionStatus = "pending" | "approved" | "rejected" | "paid" | "refunded" | "clawed_back";

export type OfferInput = {
  destinationKind: DestinationKind;
  destinationValue: string;
  linkStyle: LinkStyle;
  refParam: string;
  payoutModel: PayoutModel;
  cpaAmountUsd: number;
  cpcAmountUsd?: number;
  revsharePct?: number | null;
};

export function computeCommission(offer: OfferInput, amountUsd = 0): number {
  const amount = Number(amountUsd) || 0;
  const cpa = Number(offer.cpaAmountUsd) || 0;
  const cpc = Number(offer.cpcAmountUsd) || 0;
  const rev = Number(offer.revsharePct) || 0;

  switch (offer.payoutModel) {
    case "cpc":
      return roundMoney(cpc);
    case "cpa":
    case "cpl":
      return roundMoney(cpa);
    case "revshare":
      return amount > 0 ? roundMoney((amount * rev) / 100) : 0;
    case "hybrid":
      return roundMoney(cpa + (amount > 0 && rev > 0 ? (amount * rev) / 100 : 0));
    default:
      return 0;
  }
}

export function buildOfferDestination(opts: {
  offer: OfferInput;
  ref: string;
  clickId: string;
  origin?: string;
  sub1?: string | null;
  sub2?: string | null;
  sub3?: string | null;
}): string {
  const origin = trimOrigin(opts.origin || "https://synterax.io");
  const dest = opts.offer.destinationValue?.trim() || "/";
  const param = opts.offer.refParam?.trim() || "ref";
  const ref = opts.ref;
  const clickId = opts.clickId;

  if (opts.offer.destinationKind === "sso_card") {
    return `https://www.synteraxcard.io/api/auth/signin/synterax?callbackUrl=${dest.replaceAll(" ", "%20")}&${param}=${ref}&sx_click=${clickId}`;
  }

  let url: string;
  if (opts.offer.destinationKind === "internal") {
    const path = dest.startsWith("/") ? dest : `/${dest}`;
    if (path === "/" && opts.offer.linkStyle === "path") {
      return `${origin}/${ref}`;
    }
    if (opts.offer.linkStyle === "path") {
      return `${origin}${path.replace(/\/$/, "")}/${ref}`;
    }
    url = `${origin}${path}`;
  } else {
    url = dest;
  }

  if (opts.offer.linkStyle !== "none") {
    url = appendQuery(url, param, ref);
    url = appendQuery(url, "sx_click", clickId);
  }

  if (opts.sub1) url = appendQuery(url, "sub1", opts.sub1);
  if (opts.sub2) url = appendQuery(url, "sub2", opts.sub2);
  if (opts.sub3) url = appendQuery(url, "sub3", opts.sub3);

  if (opts.offer.destinationKind === "external" && ref) {
    if (/[?&]aff_id=/i.test(url)) {
      url = url.replace(/([?&]aff_id=)[^&]*/i, `$1${ref}`);
    } else {
      url = appendQuery(url, "aff_id", ref);
    }
  }

  return url;
}

export function trackingPath(offerSlug: string, ref: string, search?: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search || {})) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return `/go/${encodeURIComponent(offerSlug)}/${encodeURIComponent(ref)}${qs ? `?${qs}` : ""}`;
}

export function payoutLabel(model: string): string {
  switch (model) {
    case "cpa":
      return "CPA";
    case "cpc":
      return "CPC";
    case "cpl":
      return "CPL";
    case "revshare":
      return "RevShare";
    case "hybrid":
      return "Hybrid";
    default:
      return "No payout";
  }
}

export function formatMoney(value: number | string | null | undefined): string {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatPct(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value)}%`;
}

export function conversionRate(clicks: number, conversions: number): number {
  if (!clicks) return 0;
  return (conversions / clicks) * 100;
}

export function epc(clicks: number, commission: number): number {
  if (!clicks) return 0;
  return commission / clicks;
}

function appendQuery(url: string, key: string, value: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${key}=${encodeURIComponent(value)}`;
}

function trimOrigin(origin: string): string {
  return origin.replace(/\/$/, "");
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
