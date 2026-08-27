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
