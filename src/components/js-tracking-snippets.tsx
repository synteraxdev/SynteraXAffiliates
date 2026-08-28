import { CopyButton } from "@/components/copy-button";
import { javascriptTrackingSnippets } from "@/lib/js-track";

export function JsTrackingSnippets({ origin, offerSlug }: { origin: string; offerSlug: string }) {
  const snippets = javascriptTrackingSnippets(origin, offerSlug);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-medium">1. Landing pages</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Drop this on the pages people hit from affiliate links. It stores <code>sx_click</code> so you do not have to
          change checkout.
        </p>
        <pre className="mt-3 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{snippets.landing}</pre>
        <CopyButton value={snippets.landing} label="Copy landing script" />
      </div>
      <div>
        <h3 className="text-sm font-medium">2. Thank-you / conversion page</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          This is the JavaScript postback. Replace ORDER_TOTAL and ORDER_ID. No postback secret in the browser.
        </p>
        <pre className="mt-3 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{snippets.convert}</pre>
        <CopyButton value={snippets.convert} label="Copy JS postback" />
      </div>
      <div>
        <h3 className="text-sm font-medium">Next.js / React</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Use <code>next/script</code> with <code>afterInteractive</code>. Queue commands before the script loads.
        </p>
        <pre className="mt-3 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{snippets.nextApp}</pre>
        <CopyButton value={snippets.nextApp} label="Copy Next.js snippet" />
        <pre className="mt-3 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{snippets.react}</pre>
        <CopyButton value={snippets.react} label="Copy React snippet" />
      </div>
    </div>
  );
}
