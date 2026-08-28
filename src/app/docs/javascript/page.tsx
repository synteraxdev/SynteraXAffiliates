import Link from "next/link";
import { JsTrackingSnippets } from "@/components/js-tracking-snippets";
import { MarketingFooter, MarketingHeader, MarketingTicker } from "@/components/marketing-shell";
import { Card } from "@/components/ui/card";
import { appOrigin } from "@/lib/env";

export const metadata = {
  title: "JavaScript tracking — SynteraX Affiliates",
  description: "Track affiliate click IDs and fire a JavaScript postback without changing your backend.",
};

export default function JavascriptTrackingDocsPage() {
  const origin = appOrigin();

  return (
    <div className="overflow-x-hidden">
      <MarketingTicker />
      <MarketingHeader />
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.22em] text-primary">For offer partners</p>
        <h1 className="mt-3 font-heading text-4xl font-semibold">JavaScript tracking</h1>
        <p className="mt-4 text-muted-foreground">
          Use this when you already have a site in React or Next.js and do not want to wire a server-to-server postback.
          Add one script to keep the click id, then fire a JS postback on thank-you.
        </p>

        <Card className="mt-8 space-y-4 p-6">
          <h2 className="font-heading text-xl font-semibold">What it does</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Affiliate traffic hits your page with <code className="text-foreground">sx_click</code> on the URL.</li>
            <li>
              <code className="text-foreground">/t/sx.js</code> stores that click id in first-party storage on your
              domain.
            </li>
            <li>
              On conversion, <code className="text-foreground">SX.convert()</code> posts to{" "}
              <code className="text-foreground">/t/convert</code> with <code className="text-foreground">sendBeacon</code>{" "}
              or <code className="text-foreground">fetch</code>. Safe with App Router and client components.
            </li>
          </ol>
          <p className="text-sm text-muted-foreground">
            Server-to-server postbacks stay available when you can edit your backend. Those still use a secret. The JS
            path never puts that secret in the browser.
          </p>
        </Card>

        <Card className="mt-6 p-6">
          <h2 className="font-heading text-xl font-semibold">Install</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Replace the offer slug with the one we give you. Then drop the landing script on every page in the funnel,
            and the convert snippet on thank-you only.
          </p>
          <div className="mt-5">
            <JsTrackingSnippets origin={origin} offerSlug="OFFER_SLUG" />
          </div>
        </Card>

        <Card className="mt-6 space-y-3 p-6">
          <h2 className="font-heading text-xl font-semibold">API</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <code className="text-foreground">SX.getClickId()</code> — stored click id
            </li>
            <li>
              <code className="text-foreground">SX.convert({"{ amount, externalId, offer }"})</code> — JS postback
            </li>
            <li>
              <code className="text-foreground">{'SX.push(["convert", payload])'}</code> — queue before the script loads
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Endpoint: <code className="text-foreground">{origin}/t/convert</code>. CORS is open. POST JSON or{" "}
            <code className="text-foreground">text/plain</code> JSON so <code className="text-foreground">sendBeacon</code>{" "}
            works without a preflight.
          </p>
          <p className="text-sm text-muted-foreground">
            Need the server postback instead?{" "}
            <Link href="/marketplace" className="text-primary hover:underline">
              Ask the network operator
            </Link>{" "}
            for the secret URL.
          </p>
        </Card>
      </main>
      <MarketingFooter />
    </div>
  );
}
