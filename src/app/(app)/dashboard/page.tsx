import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dashboardStats, listClicks, listVisibleOffers, reportByDay } from "@/lib/data";
import { formatMoney, payoutLabel } from "@/lib/affiliate";
import { formatDateTime } from "@/lib/format";
import { getSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;
  const [stats, offers, clicks, series] = await Promise.all([
    dashboardStats(session.id),
    listVisibleOffers(false),
    listClicks({ promoterId: session.id, limit: 8 }),
    reportByDay(session.id, 10),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Overview</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">Welcome back, {session.username || "affiliate"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your referral slug is <span className="font-mono text-foreground">{session.referralSlug}</span>. Use it on
          every offer link.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clicks" value={String(stats.clicks)} />
        <StatCard label="Conversions" value={String(stats.conversions)} hint={`${stats.pending} pending review`} />
        <StatCard label="Approved earnings" value={formatMoney(stats.approvedEarnings)} />
        <StatCard label="Pending earnings" value={formatMoney(stats.pendingEarnings)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Last 10 days</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/reports">Full reports</Link>
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {series.map((day) => (
              <div key={day.date} className="text-center">
                <div
                  className="mx-auto w-full rounded-sm bg-primary/20"
                  style={{ height: `${Math.max(8, Math.min(72, day.clicks * 8))}px` }}
                  title={`${day.date}: ${day.clicks} clicks`}
                />
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">{day.date.slice(5)}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-heading text-lg font-semibold">Promote next</h2>
          <div className="mt-4 space-y-3">
            {offers.slice(0, 4).map((offer) => (
              <div key={offer.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{offer.name}</p>
                  <p className="text-xs text-muted-foreground">{payoutLabel(offer.payout_model)}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/offers/${offer.slug}`}>Open</Link>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Recent clicks</h2>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Offer</TableHead>
              <TableHead>Click ID</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clicks.map((click) => (
              <TableRow key={click.id}>
                <TableCell>{formatDateTime(click.created_at)}</TableCell>
                <TableCell>{click.offers?.name || "—"}</TableCell>
                <TableCell className="font-mono text-xs">{click.click_id.slice(0, 12)}…</TableCell>
                <TableCell>
                  {click.flagged ? <Badge variant="destructive">Flagged</Badge> : <Badge variant="secondary">OK</Badge>}
                </TableCell>
              </TableRow>
            ))}
            {!clicks.length ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No clicks yet. Copy a link from Offers to start tracking.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
