const FIELD_ALIASES = {
  clickId: ["click_id", "sx_click", "p_click_id", "clickId"],
  offer: ["offer", "offer_slug", "sx_offer", "p_offer_slug"],
  ref: ["ref", "ref_slug", "p_ref_slug"],
  externalId: ["external_id", "txn_id", "order_id", "externalId"],
  amount: ["amount", "amount_usd", "payout"],
  status: ["status"],
  type: ["type", "event"],
} as const;

export type JsConvertPayload = {
  clickId?: string;
  offer?: string;
  ref?: string;
  externalId?: string;
  amountUsd: number;
  status: string;
  type: string;
};

export function pickField(source: Record<string, string>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (value?.trim()) return value.trim();
  }
  return undefined;
}

export function parseTrackingFields(source: Record<string, string>): JsConvertPayload {
  const amountRaw = pickField(source, FIELD_ALIASES.amount);
  return {
    clickId: pickField(source, FIELD_ALIASES.clickId),
    offer: pickField(source, FIELD_ALIASES.offer),
    ref: pickField(source, FIELD_ALIASES.ref),
    externalId: pickField(source, FIELD_ALIASES.externalId),
    amountUsd: Number(amountRaw || 0) || 0,
    status: pickField(source, FIELD_ALIASES.status) || "pending",
    type: pickField(source, FIELD_ALIASES.type) || "js",
  };
}

export function parseTrackingBody(text: string, contentType: string): Record<string, string> {
  const raw = text.trim();
  if (!raw) return {};
  try {
    if (contentType.includes("application/json") || raw.startsWith("{") || raw.startsWith("[")) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, String(value ?? "")]));
      }
    }
  } catch {
    // Fall through to form parsing.
  }
  return Object.fromEntries(new URLSearchParams(raw).entries());
}

export function trackingCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export function trackerScriptSrc(origin: string) {
  return `${origin.replace(/\/$/, "")}/t/sx.js`;
}

export function convertEndpoint(origin: string) {
  return `${origin.replace(/\/$/, "")}/t/convert`;
}

export function javascriptTrackingSnippets(origin: string, offerSlug = "") {
  const scriptSrc = trackerScriptSrc(origin);
  const offer = offerSlug || "OFFER_SLUG";
  const landing = `<script src="${scriptSrc}" async></script>`;
  const convert = `<script src="${scriptSrc}"></script>
<script>
  window.SX = window.SX || [];
  SX.push(["convert", {
    offer: "${offer}",
    amount: ORDER_TOTAL,
    externalId: ORDER_ID
  }]);
</script>`;
  const nextApp = `import Script from "next/script";

export function SynteraTracker() {
  return <Script src="${scriptSrc}" strategy="afterInteractive" />;
}

export function SynteraConvert({ amount, externalId }: { amount?: number; externalId?: string }) {
  const payload = JSON.stringify({
    offer: "${offer}",
    amount: amount ?? 0,
    externalId: externalId ?? "",
  });
  return (
    <>
      <Script src="${scriptSrc}" strategy="afterInteractive" />
      <Script id="sx-convert" strategy="afterInteractive">
        {\`window.SX=window.SX||[];SX.push(["convert",\${payload}]);\`}
      </Script>
    </>
  );
}`;
  const react = `useEffect(() => {
  const payload = { offer: "${offer}", amount, externalId: orderId };
  const sx = window.SX;
  if (sx && typeof sx.convert === "function") {
    sx.convert(payload);
    return;
  }
  window.SX = window.SX || [];
  window.SX.push(["convert", payload]);
}, [orderId, amount]);`;
  return { scriptSrc, landing, convert, nextApp, react };
}

export function buildTrackerScript(origin: string) {
  const endpoint = convertEndpoint(origin);
  return `/*! SynteraX Affiliates JS tracker */
(function (w, d) {
  var ENDPOINT = ${JSON.stringify(endpoint)};
  var KEYS = { click: "sx_click", ref: "sx_ref", offer: "sx_offer" };
  var DAYS = 90;

  function qs(name) {
    try { return new URL(w.location.href).searchParams.get(name); }
    catch (e) { return null; }
  }

  function store(key, value) {
    if (!value) return;
    try { w.localStorage.setItem(key, value); } catch (e) {}
    try {
      d.cookie = key + "=" + encodeURIComponent(value) + "; Path=/; Max-Age=" + (DAYS * 86400) + "; SameSite=Lax";
    } catch (e) {}
  }

  function read(key) {
    try {
      var stored = w.localStorage.getItem(key);
      if (stored) return stored;
    } catch (e) {}
    try {
      var match = d.cookie.match(new RegExp("(?:^|; )" + key.replace(/[-.]/g, "\\\\$&") + "=([^;]+)"));
      return match ? decodeURIComponent(match[1]) : "";
    } catch (e) { return ""; }
  }

  var click = qs("sx_click") || qs("click_id");
  var ref = qs("ref");
  var offer = qs("offer") || qs("sx_offer");
  if (click) store(KEYS.click, click);
  if (ref) store(KEYS.ref, ref);
  if (offer) store(KEYS.offer, offer);

  function payload(extra) {
    extra = extra || {};
    return {
      click_id: extra.clickId || extra.click_id || extra.sx_click || read(KEYS.click),
      ref: extra.ref || read(KEYS.ref),
      offer: extra.offer || read(KEYS.offer),
      external_id: extra.externalId || extra.external_id || extra.txn_id || extra.order_id || "",
      amount: extra.amount != null ? extra.amount : (extra.payout != null ? extra.payout : ""),
      status: extra.status || "pending",
      type: extra.type || "js"
    };
  }

  function send(data, cb) {
    var body = JSON.stringify(data);
    var sent = false;
    try {
      if (w.navigator && w.navigator.sendBeacon) {
        sent = w.navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }));
      }
    } catch (e) {}
    if (!sent && w.fetch) {
      w.fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: body,
        mode: "cors",
        keepalive: true,
        credentials: "omit"
      }).then(function (res) {
        return res.json().catch(function () { return { ok: sent }; });
      }).then(function (json) {
        if (cb) cb(json);
      }).catch(function () {
        if (cb) cb({ ok: false });
      });
      return;
    }
    if (cb) cb({ ok: !!sent });
  }

  function convert(opts, cb) {
    var data = payload(opts);
    if (!data.click_id) {
      var missing = { ok: false, error: "missing_click" };
      if (cb) cb(missing);
      return missing;
    }
    send(data, cb);
    return { ok: true, queued: true, click_id: data.click_id };
  }

  var api = {
    getClickId: function () { return read(KEYS.click); },
    getRef: function () { return read(KEYS.ref); },
    convert: convert,
    ready: function (fn) { if (fn) fn(api); },
    push: function (cmd) {
      if (!cmd) return;
      if (typeof cmd === "function") { cmd(api); return; }
      var name = Array.isArray(cmd) ? cmd[0] : cmd;
      var args = Array.isArray(cmd) ? cmd.slice(1) : [];
      if (name === "convert") convert(args[0], args[1]);
      else if (name === "ready") args[0] && args[0](api);
      else if (name === "init") {
        var cfg = args[0] || {};
        if (cfg.offer) store(KEYS.offer, cfg.offer);
        if (cfg.ref) store(KEYS.ref, cfg.ref);
        if (cfg.clickId || cfg.click_id) store(KEYS.click, cfg.clickId || cfg.click_id);
      }
    }
  };

  var queued = w.SX;
  w.SX = api;
  w.SynteraX = api;
  if (Array.isArray(queued)) {
    for (var i = 0; i < queued.length; i++) api.push(queued[i]);
  }

  var tag = d.currentScript;
  if (tag && tag.getAttribute("data-convert") === "1") {
    convert({
      amount: tag.getAttribute("data-amount"),
      externalId: tag.getAttribute("data-external-id") || tag.getAttribute("data-externalId"),
      offer: tag.getAttribute("data-offer"),
      status: tag.getAttribute("data-status") || "pending"
    });
  }
})(window, document);
`;
}
