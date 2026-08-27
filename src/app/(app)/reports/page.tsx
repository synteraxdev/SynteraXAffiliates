import { HelpTip } from "@/components/help-tip";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dashboardStats, offerPerformance, reportByDay } from "@/lib/data";
import { conversionRate, epc, formatMoney } from "@/lib/affiliate";
import { getSession } from "@/lib/session";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) return null;
  const [stats, offers, days] = await Promise.all([
    dashboardStats(session.id),
    offerPerformance(session.id),
    reportByDay(session.id, 14),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Results</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">How your shares are doing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No spreadsheets needed. More clicks and signups mean more you can cash out.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="People who clicked" value={String(stats.clicks)} />
        <StatCard
          label="Signup rate"
          value={`${conversionRate(stats.clicks, stats.conversions).toFixed(1)}%`}
          hint="People who clicked and then signed up"
        />
        <StatCard
          label="Earned per click"
          value={formatMoney(epc(stats.clicks, stats.approvedEarnings + stats.pendingEarnings))}
        />
        <StatCard label="Total earned" value={formatMoney(stats.approvedEarnings + stats.pendingEarnings)} />
      </div>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">By offer</h2>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Offer</TableHead>
              <TableHead>Visits</TableHead>
              <TableHead>Signups</TableHead>
              <TableHead>
                <HelpTip label="Rate">Signups divided by clicks.</HelpTip>
              </TableHead>
              <TableHead>Earned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell>{offer.name}</TableCell>
                <TableCell>{offer.clicks}</TableCell>
                <TableCell>{offer.conversions}</TableCell>
                <TableCell>{conversionRate(offer.clicks, offer.conversions).toFixed(1)}%</TableCell>
                <TableCell>{formatMoney(offer.commission)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Last two weeks</h2>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Visits</TableHead>
              <TableHead>Signups</TableHead>
              <TableHead>Earned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map((day) => (
              <TableRow key={day.date}>
                <TableCell>{day.date}</TableCell>
                <TableCell>{day.clicks}</TableCell>
                <TableCell>{day.conversions}</TableCell>
                <TableCell>{formatMoney(day.commission)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
