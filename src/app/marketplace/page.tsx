import Link from "next/link";
import { BrandWordmark } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listVisibleOffers } from "@/lib/data";
import { earnInPlainEnglish, whoCanJoin } from "@/lib/copy";

export const dynamic = "force-dynamic";

export default async function PublicMarketplacePage() {
  const offers = await listVisibleOffers(false);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <BrandWordmark size="lg" />
        <div className="flex gap-3">
          <Button asChild variant="ghost">
            <Link href="/">Home</Link>
          </Button>
          <Button asChild>
            <a href="/api/auth/login">Join with SynteraX</a>
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl space-y-6 px-6 pb-20">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">What you can share</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold">Promote SynteraX</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Pick something that fits your audience. Sign in, copy a link, and get paid to your SynteraX Vault or in
            XFLOW.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {offers.map((offer) => (
            <Card key={offer.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-lg font-semibold">{offer.name}</h2>
                {offer.requires_approval ? (
                  <Badge variant="outline">Ask first</Badge>
                ) : (
                  <Badge variant="secondary">Open</Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{offer.description}</p>
              <p className="mt-4 text-sm font-medium">{earnInPlainEnglish(offer)}</p>
              <p className="mt-2 text-xs text-muted-foreground">Who can join: {whoCanJoin(offer.allowed_countries)}</p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
