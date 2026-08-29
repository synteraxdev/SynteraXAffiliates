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
          Track three events: click, signup, and paid conversion.
        </p>

        <Card className="mt-8 space-y-4 p-6">
          <h2 className="font-heading text-xl font-semibold">What it does</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Click</strong> — affiliate traffic hits your page with{" "}
              <code className="text-foreground">sx_click</code>. The script stores it and records the click.
            </li>
            <li>
              <strong className="text-foreground">Signup</strong> — <code className="text-foreground">SX.signup()</code>{" "}
              on account create. Counted, not paid.
            </li>
            <li>
              <strong className="text-foreground">Paid</strong> — <code className="text-foreground">SX.paid()</code> on
              thank-you with amount and order id. This is the payable conversion.
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
            Replace the offer slug with the one we give you. Landing script on every funnel page, signup after they
            register, paid on thank-you.
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
              <code className="text-foreground">SX.click()</code> / <code className="text-foreground">SX.signup()</code> /{" "}
              <code className="text-foreground">SX.paid()</code>
            </li>
            <li>
              <code className="text-foreground">{'SX.push(["signup"|"paid", payload])'}</code> — queue before the script
              loads
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
