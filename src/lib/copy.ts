import { formatMoney, formatPct } from "@/lib/affiliate";

export function earnInPlainEnglish(offer: {
  payout_model: string;
  cpa_amount_usd?: number | null;
  revshare_pct?: number | null;
}): string {
  const cpa = Number(offer.cpa_amount_usd || 0);
  const rev = offer.revshare_pct == null ? null : Number(offer.revshare_pct);
  switch (offer.payout_model) {
    case "cpa":
    case "cpl":
      return `${formatMoney(cpa)} each time someone you sent signs up`;
    case "cpc":
      return `${formatMoney(cpa || 0)} per click`;
    case "revshare":
      return `${formatPct(rev)} of what they spend`;
    case "hybrid":
      return `${formatMoney(cpa)} per signup plus ${formatPct(rev)} of what they spend`;
    default:
      return "This one is for awareness — it does not pay by default";
  }
}

export function whoCanJoin(countries?: string[] | null): string {
  return countries?.length ? countries.join(", ") : "Anyone, worldwide";
}

export function defaultShareMessage(offerName: string): string {
  return `I'm sharing SynteraX — ${offerName}. Join with my link:`;
}

export function notificationLabel(kind: string): string {
  switch (kind) {
    case "payout.requested":
      return "Cash out";
    case "payout.paid":
      return "Paid";
    case "offer.application":
      return "Access";
    case "offer.approved":
      return "Approved";
    case "offer.rejected":
      return "Not approved";
    case "offer.new":
      return "New offer";
    case "fraud.flag":
      return "Needs a look";
    default:
      return "Update";
  }
}
