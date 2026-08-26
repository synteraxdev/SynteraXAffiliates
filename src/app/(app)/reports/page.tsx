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
        <h1 className="font-heading text-3xl font-semibold">Reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">Clicks, conversions, EPC, and commission by offer and day.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Clicks" value={String(stats.clicks)} />
        <StatCard label="CR" value={`${conversionRate(stats.clicks, stats.conversions).toFixed(1)}%`} />
        <StatCard label="EPC" value={formatMoney(epc(stats.clicks, stats.approvedEarnings + stats.pendingEarnings))} />
        <StatCard label="Commission" value={formatMoney(stats.approvedEarnings + stats.pendingEarnings)} />
      </div>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">By offer</h2>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Offer</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Conversions</TableHead>
              <TableHead>CR</TableHead>
              <TableHead>Commission</TableHead>
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
        <h2 className="font-heading text-lg font-semibold">By day</h2>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Conversions</TableHead>
              <TableHead>Commission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map((day) => (
              <TableRow key={day.date}>
                <TableCell className="font-mono text-sm">{day.date}</TableCell>
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
