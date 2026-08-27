import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOfferAccess, listApplications, listVisibleOffers, offerDailyCap } from "@/lib/data";
import { formatMoney, formatPct, payoutLabel } from "@/lib/affiliate";
import { getSession } from "@/lib/session";

export default async function OffersPage() {
  const session = await getSession();
  if (!session) return null;
  const offers = await listVisibleOffers(false);
  const applications = await listApplications({ profileId: session.id });
  const appByOffer = new Map(applications.map((row) => [row.offer_id, row]));
  const caps = await Promise.all(offers.map((offer) => offerDailyCap(offer.id, offer.daily_conversion_cap)));
  const accessRows = await Promise.all(offers.map((offer) => getOfferAccess(offer.id, session.id)));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Marketplace</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">Offers</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Apply to private offers, copy tracking links, and watch remaining daily caps before you send traffic.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {offers.map((offer, index) => {
          const application = appByOffer.get(offer.id);
          const access = accessRows[index];
          const remaining = caps[index];
          return (
            <Card key={offer.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-lg font-semibold">{offer.name}</h2>
                    <Badge variant="secondary">{offer.category}</Badge>
                    <Badge>{payoutLabel(offer.payout_model)}</Badge>
                    {offer.requires_approval ? <Badge variant="outline">Private</Badge> : null}
                    {offer.smartlink_enabled ? <Badge variant="outline">Smartlink</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{offer.description}</p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/offers/${offer.slug}`}>{offer.cta_label}</Link>
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Meta label="CPA" value={formatMoney(offer.cpa_amount_usd)} />
                <Meta label="RevShare" value={formatPct(offer.revshare_pct)} />
                <Meta label="Cookie" value={`${offer.cookie_hours}h`} />
                <Meta
                  label="Daily cap left"
                  value={remaining == null ? "Open" : String(remaining)}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {offer.allowed_countries?.length ? (
                  <span>Geo: {offer.allowed_countries.join(", ")}</span>
                ) : (
                  <span>Geo: worldwide</span>
                )}
                {offer.allowed_devices?.length ? <span>Device: {offer.allowed_devices.join(", ")}</span> : null}
                {offer.requires_approval ? (
                  <span>
                    Access:{" "}
                    {access.allowed
                      ? "approved"
                      : application?.status === "pending"
                        ? "application pending"
                        : application?.status || "apply required"}
                  </span>
                ) : null}
              </div>
            </Card>
          );
        })}
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
