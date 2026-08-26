import { CopyButton } from "@/components/copy-button";
import { Card } from "@/components/ui/card";
import { appOrigin } from "@/lib/env";
import { getSession } from "@/lib/session";

export default async function ToolsPage() {
  const session = await getSession();
  if (!session) return null;
  const origin = appOrigin();
  const postback = `${origin}/t/postback?offer=YOUR_SLUG&secret=OFFER_SECRET&click_id={clickid}&external_id={txn}&amount={payout}&status=approved`;
  const pixel = `${origin}/t/pixel?sx_click={clickid}&amount={payout}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Tracking tools</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use these endpoints on partner landers. Admins can see each offer secret from the offer editor.
        </p>
      </div>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Server-to-server postback</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          GET or POST. The offer secret is the credential. Duplicate <span className="font-mono">external_id</span>{" "}
          values are ignored.
        </p>
        <pre className="mt-4 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{postback}</pre>
        <div className="mt-3">
          <CopyButton value={postback} />
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Conversion pixel</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Fire a 1×1 GIF on thank-you pages when you cannot send a server postback.
        </p>
        <pre className="mt-4 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{`<img src="${pixel}" width="1" height="1" alt="" />`}</pre>
        <CopyButton value={`<img src="${pixel}" width="1" height="1" alt="" />`} />
      </Card>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Click macros</h2>
        <ul className="mt-3 space-y-2 font-mono text-sm text-muted-foreground">
          <li>sx_click — unique click id placed on the destination URL</li>
          <li>ref / aff_id — your referral slug ({session.referralSlug})</li>
          <li>sub1, sub2, sub3 — campaign tokens</li>
        </ul>
      </Card>
    </div>
  );
}
