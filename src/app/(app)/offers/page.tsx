import Link from "next/link";
import { HelpTip } from "@/components/help-tip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOfferAccess, listApplications, listVisibleOffers, offerDailyCap } from "@/lib/data";
import { earnInPlainEnglish } from "@/lib/copy";
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
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Promote</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">What do you want to share?</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Tap an offer, copy the link we make for you, and send it to people. If they join, you earn.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {offers.map((offer, index) => {
          const application = appByOffer.get(offer.id);
          const access = accessRows[index];
          const remaining = caps[index];
          const locked = offer.requires_approval && !access.allowed;
          return (
            <Card key={offer.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-lg font-semibold">{offer.name}</h2>
                    {offer.requires_approval ? <Badge variant="outline">Ask first</Badge> : <Badge>Open</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{offer.description}</p>
                  <p className="mt-3 text-sm font-medium">{earnInPlainEnglish(offer)}</p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/offers/${offer.slug}`}>{locked ? "Request access" : "Get my link"}</Link>
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>
                  <HelpTip label="Countries">Who can open this offer. Worldwide means anyone.</HelpTip>
                  : {offer.allowed_countries?.length ? offer.allowed_countries.join(", ") : "Worldwide"}
                </span>
                {remaining != null ? <span>Spots left today: {remaining}</span> : null}
                {locked && application?.status === "pending" ? <span>Your request is waiting</span> : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
