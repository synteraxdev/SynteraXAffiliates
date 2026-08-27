import { describe, expect, it } from "vitest";
import { defaultShareMessage, earnInPlainEnglish, notificationLabel, offerPreviewSrc, whoCanJoin } from "@/lib/copy";

describe("plain-language copy", () => {
  it("explains earnings without CPA jargon", () => {
    expect(earnInPlainEnglish({ payout_model: "cpa", cpa_amount_usd: 25 })).toMatch(/\$25/);
    expect(earnInPlainEnglish({ payout_model: "cpa", cpa_amount_usd: 25 })).not.toMatch(/CPA/i);
  });

  it("labels alerts without raw event kinds", () => {
    expect(notificationLabel("payout.paid")).toBe("Paid");
    expect(notificationLabel("offer.application")).toBe("Access");
  });

  it("treats an empty country list as worldwide", () => {
    expect(whoCanJoin([])).toBe("Anyone, worldwide");
  });

  it("builds a ready-made share message", () => {
    expect(defaultShareMessage("Membership")).toMatch(/SynteraX/);
  });

  it("uses a stored preview or the local screenshot for that offer", () => {
    expect(offerPreviewSrc({ slug: "membership", preview_image_url: "https://cdn.example/a.png" })).toBe(
      "https://cdn.example/a.png",
    );
    expect(offerPreviewSrc({ slug: "membership" })).toBe("/offers/membership.png");
  });
});
