import { describe, expect, it } from "vitest";
import {
  conversionStatusLabel,
  isPayoutMethod,
  parsePayoutMethod,
  payoutDestination,
  payoutMethodLabel,
} from "@/lib/payouts";

describe("affiliate payout destinations", () => {
  it("only allows vault USD and xflow tokens", () => {
    expect(isPayoutMethod("vault")).toBe(true);
    expect(isPayoutMethod("xflow")).toBe(true);
    expect(isPayoutMethod("manual")).toBe(false);
    expect(isPayoutMethod("usdt")).toBe(false);
    expect(isPayoutMethod("bank")).toBe(false);
    expect(parsePayoutMethod("manual")).toBe("vault");
  });

  it("labels destinations the way SynteraX members already know them", () => {
    expect(payoutMethodLabel("vault")).toBe("SynteraX Vault (USD)");
    expect(payoutMethodLabel("xflow")).toBe("XFLOW tokens");
    expect(payoutDestination("vault", "lewis").currency).toBe("USD");
    expect(payoutDestination("xflow").currency).toBe("XFLOW");
  });

  it("explains earnings status in plain English", () => {
    expect(conversionStatusLabel("pending", "hold 2d")).toBe("Checking — about 2 days left");
    expect(conversionStatusLabel("pending", "hold expired")).toBe("Waiting for review");
    expect(conversionStatusLabel("approved")).toBe("Ready to cash out");
  });
});
