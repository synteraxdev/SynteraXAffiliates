import { notFound } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getOfferBySlug, listCreatives } from "@/lib/data";
import { formatMoney, formatPct, payoutLabel, trackingPath } from "@/lib/affiliate";
import { getSession } from "@/lib/session";
import { appOrigin } from "@/lib/env";

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { slug } = await params;
  const offer = await getOfferBySlug(slug);
  if (!offer || (!offer.member_visible && !["admin", "company"].includes(session.role))) notFound();
  const creatives = await listCreatives(offer.id);
  const origin = appOrigin();
  const link = `${origin}${trackingPath(offer.slug, session.referralSlug)}`;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-3xl font-semibold">{offer.name}</h1>
          <Badge>{payoutLabel(offer.payout_model)}</Badge>
          <Badge variant="secondary">{offer.conversion_type}</Badge>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{offer.description}</p>
      </div>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Your tracking link</p>
        <p className="mt-3 break-all font-mono text-sm">{link}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <CopyButton value={link} label="Copy link" />
          <CopyButton
            value={`${link}?sub1=youtube&sub2=story`}
            label="Copy with sub IDs"
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Append <span className="font-mono">sub1</span>, <span className="font-mono">sub2</span>, and{" "}
          <span className="font-mono">sub3</span> for channel-level reporting.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Info label="CPA" value={formatMoney(offer.cpa_amount_usd)} />
        <Info label="CPC" value={formatMoney(offer.cpc_amount_usd)} />
        <Info label="RevShare" value={formatPct(offer.revshare_pct)} />
        <Info label="Cookie / attribution" value={`${offer.cookie_hours}h · ${offer.attribution}`} />
      </div>

      {offer.terms ? (
        <Card className="p-5">
          <h2 className="font-heading text-lg font-semibold">Terms</h2>
          <p className="mt-2 text-sm text-muted-foreground">{offer.terms}</p>
        </Card>
      ) : null}

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Creatives</h2>
        {creatives.map((creative) => (
          <Card key={creative.id} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{creative.name}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{creative.kind}</p>
              </div>
              <CopyButton value={creative.body} label="Copy copy" />
            </div>
            <pre className="mt-3 overflow-auto rounded-md bg-background/60 p-3 font-mono text-xs whitespace-pre-wrap">
              {creative.body}
            </pre>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </Card>
  );
}
