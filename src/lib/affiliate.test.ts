import { describe, expect, it } from "vitest";
import {
  buildOfferDestination,
  computeCommission,
  conversionRate,
  epc,
  trackingPath,
} from "@/lib/affiliate";

const baseOffer = {
  destinationKind: "external" as const,
  destinationValue: "https://partner.example/offer?aff_id=house",
  linkStyle: "query" as const,
  refParam: "ref",
  payoutModel: "cpa" as const,
  cpaAmountUsd: 25,
  cpcAmountUsd: 0.4,
  revsharePct: 10,
};

describe("computeCommission", () => {
  it("pays CPA flat", () => {
    expect(computeCommission({ ...baseOffer, payoutModel: "cpa" }, 100)).toBe(25);
  });

  it("pays CPC flat", () => {
    expect(computeCommission({ ...baseOffer, payoutModel: "cpc" }, 0)).toBe(0.4);
  });

  it("pays revshare on amount", () => {
    expect(computeCommission({ ...baseOffer, payoutModel: "revshare" }, 200)).toBe(20);
  });

  it("pays hybrid CPA plus revshare", () => {
    expect(computeCommission({ ...baseOffer, payoutModel: "hybrid" }, 200)).toBe(45);
  });
});

describe("buildOfferDestination", () => {
  it("rewrites external aff_id and appends click tokens", () => {
    const url = buildOfferDestination({
      offer: baseOffer,
      ref: "sky88",
      clickId: "abc123",
      sub1: "yt",
    });
    expect(url).toContain("aff_id=sky88");
    expect(url).toContain("ref=sky88");
    expect(url).toContain("sx_click=abc123");
    expect(url).toContain("sub1=yt");
  });

  it("builds internal path-style membership links", () => {
    const url = buildOfferDestination({
      offer: {
        ...baseOffer,
        destinationKind: "internal",
        destinationValue: "/register",
        linkStyle: "path",
      },
      ref: "sky88",
      clickId: "click1",
      origin: "https://synterax.io",
    });
    expect(url).toBe("https://synterax.io/register/sky88");
  });

  it("builds SynteraX Card SSO destinations", () => {
    const url = buildOfferDestination({
      offer: {
        ...baseOffer,
        destinationKind: "sso_card",
        destinationValue: "/order",
      },
      ref: "sky88",
      clickId: "click9",
    });
    expect(url).toContain("synteraxcard.io");
    expect(url).toContain("sx_click=click9");
  });
});

describe("reporting helpers", () => {
  it("computes conversion rate and EPC", () => {
    expect(conversionRate(200, 8)).toBe(4);
    expect(epc(200, 50)).toBe(0.25);
    expect(trackingPath("membership", "sky88", { sub1: "ad" })).toBe("/go/membership/sky88?sub1=ad");
  });
});
