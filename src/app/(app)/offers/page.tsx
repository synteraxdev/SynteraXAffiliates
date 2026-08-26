import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listVisibleOffers } from "@/lib/data";
import { formatMoney, formatPct, payoutLabel } from "@/lib/affiliate";

export default async function OffersPage() {
  const offers = await listVisibleOffers(false);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Marketplace</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">Offers</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every active offer you can promote. Open one to copy your tracking link, creatives, and postback docs.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {offers.map((offer) => (
          <Card key={offer.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-lg font-semibold">{offer.name}</h2>
                  <Badge variant="secondary">{offer.category}</Badge>
                  <Badge>{payoutLabel(offer.payout_model)}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{offer.description}</p>
              </div>
              <Button asChild size="sm">
                <Link href={`/offers/${offer.slug}`}>{offer.cta_label}</Link>
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <Meta label="CPA" value={formatMoney(offer.cpa_amount_usd)} />
              <Meta label="RevShare" value={formatPct(offer.revshare_pct)} />
              <Meta label="Cookie" value={`${offer.cookie_hours}h`} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
