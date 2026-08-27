import { MarketingFooter, MarketingHeader, MarketingTicker } from "@/components/marketing-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listVisibleOffers } from "@/lib/data";
import { earnInPlainEnglish, whoCanJoin } from "@/lib/copy";

export const dynamic = "force-dynamic";

export default async function PublicMarketplacePage() {
  const offers = await listVisibleOffers(false);

  return (
    <div className="overflow-x-hidden">
      <MarketingTicker />
      <MarketingHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-16 pb-20">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">What you can promote</p>
        <h1 className="mt-3 font-heading text-4xl font-semibold sm:text-5xl">Share SynteraX. Get paid when they join.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Membership, the card, and XFLOW — products your audience already wants. Sign in, grab your link, and earn to
          your Vault or in XFLOW.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {offers.map((offer) => (
            <Card key={offer.id} className="flex flex-col p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-2xl font-semibold">{offer.name}</h2>
                {offer.requires_approval ? (
                  <Badge variant="outline">Ask first</Badge>
                ) : (
                  <Badge variant="secondary">Open</Badge>
                )}
              </div>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">{offer.description}</p>
              <p className="mt-5 text-lg text-primary">{earnInPlainEnglish(offer)}</p>
              <p className="mt-2 text-xs text-muted-foreground">Who can join: {whoCanJoin(offer.allowed_countries)}</p>
              <Button asChild className="mt-6">
                <a href="/api/auth/login">Promote this</a>
              </Button>
            </Card>
          ))}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
