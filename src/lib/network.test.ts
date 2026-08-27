import { describe, expect, it } from "vitest";
import {
  applyPartnerRates,
  bakeCreative,
  blockedReasonCopy,
  expandPostbackMacros,
  holdLabel,
  pickAttributedClick,
  splitLinearCommission,
  utmTrackingLink,
} from "@/lib/network";

describe("applyPartnerRates", () => {
  const base = { cpaAmountUsd: 40, cpcAmountUsd: 1, revsharePct: 20 };

  it("applies gold multiplier and revshare bonus", () => {
    expect(applyPartnerRates(base, null, { cpaMultiplier: 1.25, revshareBonusPct: 5 })).toEqual({
      cpaAmountUsd: 50,
      cpcAmountUsd: 1.25,
      revsharePct: 25,
    });
  });

  it("uses per-affiliate override instead of tier", () => {
    expect(applyPartnerRates(base, { cpaAmountUsd: 80 }, { cpaMultiplier: 1.25, revshareBonusPct: 5 })).toEqual({
      cpaAmountUsd: 80,
      cpcAmountUsd: 1,
      revsharePct: 20,
    });
  });
});

describe("attribution", () => {
  const clicks = [
    { click_id: "a", created_at: "2026-01-01T00:00:00Z" },
    { click_id: "b", created_at: "2026-01-02T00:00:00Z" },
    { click_id: "c", created_at: "2026-01-03T00:00:00Z" },
  ];

  it("picks first and last click", () => {
    expect(pickAttributedClick(clicks, "first_click")[0].click_id).toBe("a");
    expect(pickAttributedClick(clicks, "last_click")[0].click_id).toBe("c");
    expect(pickAttributedClick(clicks, "linear")).toHaveLength(3);
  });

  it("splits linear commission without losing cents", () => {
    expect(splitLinearCommission(10, 3)).toEqual([3.34, 3.33, 3.33]);
    expect(splitLinearCommission(10, 3).reduce((sum, n) => sum + n, 0)).toBeCloseTo(10);
  });
});

describe("creatives and postbacks", () => {
  it("expands tracker macros", () => {
    expect(
      expandPostbackMacros("https://track.example/pb?cid={clickid}&payout={payout}&status={status}", {
        clickid: "abc",
        payout: 12.5,
        status: "approved",
      }),
    ).toBe("https://track.example/pb?cid=abc&payout=12.5&status=approved");
  });

  it("bakes affiliate link into creative copy", () => {
    const baked = bakeCreative("Join SynteraX {{offer}} — {{link}}", {
      link: "https://affiliates.synterax.io/go/membership/sky",
      ref: "sky",
      offer: "membership",
      utmLink: "https://x",
    });
    expect(baked).toContain("membership");
    expect(baked).toContain("/go/membership/sky");
  });

  it("appends the link when the creative has no placeholder", () => {
    const baked = bakeCreative("Short blurb", {
      link: "https://affiliates.synterax.io/go/membership/sky",
      ref: "sky",
      offer: "membership",
      utmLink: "https://x",
    });
    expect(baked).toContain("https://affiliates.synterax.io/go/membership/sky");
  });

  it("adds UTM presets", () => {
    const url = utmTrackingLink("https://affiliates.synterax.io/go/membership/sky", "membership", "sky");
    expect(url).toContain("utm_source=affiliate");
    expect(url).toContain("utm_campaign=membership");
    expect(url).toContain("utm_content=sky");
  });
});

describe("hold and blocked copy", () => {
  it("labels expired and remaining holds", () => {
    expect(holdLabel("2000-01-01T00:00:00Z", "pending")).toBe("hold expired");
    expect(holdLabel(null, "approved")).toBe("approved");
  });

  it("explains geo blocks", () => {
    expect(blockedReasonCopy("geo")).toMatch(/country/i);
  });
});
