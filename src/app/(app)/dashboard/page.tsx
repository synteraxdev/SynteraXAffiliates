import Link from "next/link";
import { GettingStarted } from "@/components/getting-started";
import { HelpTip } from "@/components/help-tip";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { dashboardStats, getProfile, listClicks, listTrackingLinks, listVisibleOffers } from "@/lib/data";
import { formatMoney } from "@/lib/affiliate";
import { earnInPlainEnglish } from "@/lib/copy";
import { isPayoutMethod } from "@/lib/payouts";
import { getSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;
  const [stats, offers, clicks, links, profile] = await Promise.all([
    dashboardStats(session.id),
    listVisibleOffers(false),
    listClicks({ promoterId: session.id, limit: 5 }),
    listTrackingLinks(session.id),
    getProfile(session.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Home</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">
          Hi {session.username || "there"} — ready to share SynteraX?
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          You send people a link. If they join or buy, you earn. We pay into your SynteraX Vault in USD or as XFLOW
          tokens.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="People who clicked" value={String(stats.clicks)} />
        <StatCard
          label="Signups waiting"
          value={String(stats.pending)}
          hint="We hold these a few days, like other networks"
        />
        <StatCard label="Ready to cash out" value={formatMoney(stats.availableEarnings)} />
        <StatCard label="Already paid" value={formatMoney(stats.paidEarnings)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <GettingStarted
          hasLink={links.length > 0 || clicks.length > 0}
          hasClick={clicks.length > 0}
          hasPayoutMethod={
            isPayoutMethod(profile?.payout_method) &&
            isPayoutMethod((profile?.payout_details as { kind?: string } | undefined)?.kind)
          }
        />
        <Card className="p-5">
          <h2 className="font-heading text-lg font-semibold">Pick something to share</h2>
          <p className="mt-1 text-sm text-muted-foreground">Each card tells you what you earn in plain English.</p>
          <div className="mt-4 space-y-3">
            {offers.slice(0, 4).map((offer) => (
              <div key={offer.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3">
                <div>
                  <p className="text-sm font-medium">{offer.name}</p>
                  <p className="text-xs text-muted-foreground">{earnInPlainEnglish(offer)}</p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/offers/${offer.slug}`}>Get link</Link>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold">
            <HelpTip label="Recent visits">A visit is counted when someone opens your share link.</HelpTip>
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/reports">See results</Link>
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {clicks.map((click) => (
            <div key={click.id} className="flex items-center justify-between text-sm">
              <span>{click.offers?.name || "Offer"}</span>
              {click.flagged ? <Badge variant="destructive">Needs a look</Badge> : <Badge variant="secondary">Counted</Badge>}
            </div>
          ))}
          {!clicks.length ? (
            <p className="text-sm text-muted-foreground">No visits yet. Copy a link from Promote and share it.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
