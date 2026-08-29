import { describe, expect, it } from "vitest";
import {
  buildTrackerScript,
  convertEndpoint,
  javascriptTrackingSnippets,
  isPayableConversionType,
  isSignupConversionType,
  normalizeTrackingEvent,
  parseTrackingBody,
  parseTrackingFields,
  trackerScriptSrc,
} from "@/lib/js-track";

describe("parseTrackingFields", () => {
  it("reads click id aliases used by S2S and JS", () => {
    expect(parseTrackingFields({ sx_click: "abc123" }).clickId).toBe("abc123");
    expect(parseTrackingFields({ click_id: "abc123" }).clickId).toBe("abc123");
    expect(parseTrackingFields({ clickId: "abc123" }).clickId).toBe("abc123");
  });

  it("reads amount and Next.js-style camelCase ids", () => {
    const parsed = parseTrackingFields({
      amount: "25.5",
      externalId: "ord_9",
      offer: "debit-card",
    });
    expect(parsed.amountUsd).toBe(25.5);
    expect(parsed.externalId).toBe("ord_9");
    expect(parsed.offer).toBe("debit-card");
    expect(parsed.type).toBe("paid");
  });

  it("maps event aliases to click, signup, or paid", () => {
    expect(normalizeTrackingEvent("landing")).toBe("click");
    expect(normalizeTrackingEvent("register")).toBe("signup");
    expect(normalizeTrackingEvent("sale")).toBe("paid");
    expect(parseTrackingFields({ type: "signup" }).type).toBe("signup");
    expect(parseTrackingFields({ conversion_type: "click" }).type).toBe("click");
    expect(isSignupConversionType("signup")).toBe(true);
    expect(isPayableConversionType("paid")).toBe(true);
    expect(isPayableConversionType("signup")).toBe(false);
  });
});

describe("parseTrackingBody", () => {
  it("parses JSON and text/plain JSON for sendBeacon", () => {
    const json = parseTrackingBody('{"sx_click":"c1","amount":10}', "text/plain");
    expect(json.sx_click).toBe("c1");
    expect(json.amount).toBe("10");
  });

  it("parses form bodies", () => {
    const form = parseTrackingBody("click_id=c2&payout=12", "application/x-www-form-urlencoded");
    expect(form.click_id).toBe("c2");
    expect(form.payout).toBe("12");
  });
});

describe("tracker script", () => {
  it("points convert traffic at the same origin and exposes a queue", () => {
    const script = buildTrackerScript("https://affiliates.synterax.io");
    expect(script).toContain("https://affiliates.synterax.io/t/convert");
    expect(script).toContain("sx_click");
    expect(script).toContain("sendBeacon");
    expect(script).toContain("push: function");
    expect(script).toContain("w.SX = api");
    expect(script).toContain("data-convert");
    expect(script).toContain("signup");
    expect(script).toContain('return "click"');
    expect(script).not.toContain("document.write");
  });

  it("builds Next.js-safe snippets without a browser secret", () => {
    const snippets = javascriptTrackingSnippets("https://affiliates.synterax.io", "debit-card");
    expect(snippets.scriptSrc).toBe("https://affiliates.synterax.io/t/sx.js");
    expect(snippets.landing).toContain("/t/sx.js");
    expect(snippets.signup).toContain('["signup"');
    expect(snippets.convert).toContain('["paid"');
    expect(snippets.nextApp).toContain("next/script");
    expect(snippets.nextApp).toContain("afterInteractive");
    expect(snippets.react).toContain("useEffect");
    expect(snippets.convert).not.toContain("secret=");
    expect(convertEndpoint("https://affiliates.synterax.io/")).toBe("https://affiliates.synterax.io/t/convert");
    expect(trackerScriptSrc("https://affiliates.synterax.io/")).toBe("https://affiliates.synterax.io/t/sx.js");
  });
});
