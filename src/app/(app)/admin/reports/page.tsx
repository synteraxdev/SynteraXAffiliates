import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dashboardStats, offerPerformance, reportByDay } from "@/lib/data";
import { conversionRate, formatMoney } from "@/lib/affiliate";

export default async function AdminReportsPage() {
  const [stats, offers, days] = await Promise.all([dashboardStats(), offerPerformance(), reportByDay(undefined, 14)]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-semibold">Network reports</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clicks" value={String(stats.clicks)} />
        <StatCard label="Signups" value={String(stats.signups)} />
        <StatCard label="Paid" value={String(stats.conversions)} />
        <StatCard label="Commission" value={formatMoney(stats.approvedEarnings + stats.pendingEarnings)} />
      </div>
      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Offer</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Signups</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>CR</TableHead>
              <TableHead>Commission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell>{offer.name}</TableCell>
                <TableCell>{offer.clicks}</TableCell>
                <TableCell>{offer.signups}</TableCell>
                <TableCell>{offer.paid}</TableCell>
                <TableCell>{conversionRate(offer.clicks, offer.paid).toFixed(1)}%</TableCell>
                <TableCell>{formatMoney(offer.commission)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Signups</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Commission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map((day) => (
              <TableRow key={day.date}>
                <TableCell className="font-mono text-sm">{day.date}</TableCell>
                <TableCell>{day.clicks}</TableCell>
                <TableCell>{day.signups}</TableCell>
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
