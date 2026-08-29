import { CopyButton } from "@/components/copy-button";
import { javascriptTrackingSnippets } from "@/lib/js-track";

export function JsTrackingSnippets({ origin, offerSlug }: { origin: string; offerSlug: string }) {
  const snippets = javascriptTrackingSnippets(origin, offerSlug);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-medium">1. Clicks — every landing page</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Stores <code>sx_click</code> and records the click once per visit. No checkout changes.
        </p>
        <pre className="mt-3 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{snippets.landing}</pre>
        <CopyButton value={snippets.landing} label="Copy click script" />
      </div>
      <div>
        <h3 className="text-sm font-medium">2. Signups — after they create an account</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Fire this on the welcome / verify-email page. Use their user id as <code>externalId</code>. This does not pay
          commission.
        </p>
        <pre className="mt-3 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{snippets.signup}</pre>
        <CopyButton value={snippets.signup} label="Copy signup postback" />
      </div>
      <div>
        <h3 className="text-sm font-medium">3. Paid conversions — thank-you page</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Fire this when they pay. Same person can have a signup and a paid conversion. No secret in the browser.
        </p>
        <pre className="mt-3 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{snippets.convert}</pre>
        <CopyButton value={snippets.convert} label="Copy paid postback" />
      </div>
      <div>
        <h3 className="text-sm font-medium">Next.js / React</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Load the tracker on every page. Queue <code>signup</code> and <code>paid</code> on the matching screens.
        </p>
        <pre className="mt-3 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{snippets.nextApp}</pre>
        <CopyButton value={snippets.nextApp} label="Copy Next.js snippet" />
        <pre className="mt-3 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{snippets.react}</pre>
        <CopyButton value={snippets.react} label="Copy React snippet" />
      </div>
    </div>
  );
}
