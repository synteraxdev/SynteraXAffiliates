export const PAYOUT_METHODS = ["vault", "xflow"] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];

export function isPayoutMethod(value: unknown): value is PayoutMethod {
  return value === "vault" || value === "xflow";
}

export function parsePayoutMethod(value: unknown): PayoutMethod {
  if (isPayoutMethod(value)) return value;
  return "vault";
}

export function payoutMethodLabel(method: string | null | undefined): string {
  if (method === "xflow") return "XFLOW tokens";
  return "SynteraX Vault (USD)";
}

export function payoutMethodHelp(method: PayoutMethod): string {
  if (method === "xflow") {
    return "We convert your approved USD earnings into XFLOW at the live SynteraX token price and credit your Token Vault — the same place membership XFLOW already goes.";
  }
  return "We send USD to your SynteraX Vault. You can spend it inside SynteraX the same way weekly commissions already arrive.";
}

export function payoutDestination(method: PayoutMethod, username?: string | null) {
  return {
    kind: method,
    currency: method === "xflow" ? "XFLOW" : "USD",
    network: "synterax",
    username: username || null,
  };
}

export function payoutStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "requested":
      return "Sent for review";
    case "approved":
      return "Approved — sending soon";
    case "paid":
      return "Paid";
    case "rejected":
      return "Declined";
    case "cancelled":
      return "Cancelled";
    default:
      return status || "Unknown";
  }
}

export function conversionStatusLabel(status: string, hold?: string): string {
  switch (status) {
    case "pending": {
      const match = hold?.match(/hold (\d+)([hd])/);
      if (match) {
        const amount = match[1];
        const unit = match[2] === "h" ? (amount === "1" ? "hour" : "hours") : amount === "1" ? "day" : "days";
        return `Checking — about ${amount} ${unit} left`;
      }
      return "Waiting for review";
    }
    case "approved":
      return "Ready to cash out";
    case "paid":
      return "Already paid";
    case "rejected":
      return "Not approved";
    case "refunded":
      return "Refunded — no pay";
    case "clawed_back":
      return "Reversed";
    default:
      return status;
  }
}
