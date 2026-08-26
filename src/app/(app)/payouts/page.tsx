import { requestPayout, savePayoutDetails } from "@/app/actions/affiliate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dashboardStats, getSettings, listPayouts } from "@/lib/data";
import { formatMoney } from "@/lib/affiliate";
import { formatDateTime } from "@/lib/format";
import { getSession } from "@/lib/session";

export default async function PayoutsPage() {
  const session = await getSession();
  if (!session) return null;
  const [stats, payouts, settings] = await Promise.all([
    dashboardStats(session.id),
    listPayouts(session.id),
    getSettings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Payouts</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Approved commissions can be withdrawn once you reach {formatMoney(settings.min_payout_usd)}.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Available</p>
          <p className="mt-2 font-heading text-2xl">{formatMoney(stats.approvedEarnings)}</p>
          <form action={requestPayout} className="mt-4">
            <Button type="submit">Request payout</Button>
          </form>
        </Card>
        <Card className="p-4 md:col-span-2">
          <form action={savePayoutDetails} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payout_method">Method</Label>
              <Input id="payout_method" name="payout_method" defaultValue="manual" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet">Wallet / destination</Label>
              <Input id="wallet" name="wallet" placeholder="USDT / bank / note" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" variant="outline">
                Save payout details
              </Button>
            </div>
          </form>
        </Card>
      </div>
      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requested</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.map((payout) => (
              <TableRow key={payout.id}>
                <TableCell>{formatDateTime(payout.created_at)}</TableCell>
                <TableCell>{formatMoney(payout.amount_usd)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{payout.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {!payouts.length ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  No payout requests yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
