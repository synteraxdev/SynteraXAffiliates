import { PayoutWizard } from "@/components/payout-wizard";
import { HelpTip } from "@/components/help-tip";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dashboardStats, getProfile, getSettings, listPayouts } from "@/lib/data";
import { formatMoney } from "@/lib/affiliate";
import { formatDateTime } from "@/lib/format";
import { parsePayoutMethod, payoutMethodLabel, payoutStatusLabel } from "@/lib/payouts";
import { getSession } from "@/lib/session";

export default async function PayoutsPage() {
  const session = await getSession();
  if (!session) return null;
  const [stats, payouts, settings, profile] = await Promise.all([
    dashboardStats(session.id),
    listPayouts(session.id),
    getSettings(),
    getProfile(session.id),
  ]);
  const method = parsePayoutMethod(profile?.payout_method);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Cash out</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">Get paid</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Same destinations as SynteraX membership: USD into your Vault, or XFLOW tokens. We do not pay bank accounts,
          USDT wallets, or any other method from this portal.
        </p>
      </div>
      <PayoutWizard
        available={stats.availableEarnings}
        minimum={Number(settings.min_payout_usd || 0)}
        currentMethod={method}
      />
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Your requests</h2>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>
                <HelpTip label="Paid as">USD Vault or XFLOW tokens only.</HelpTip>
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.map((payout) => (
              <TableRow key={payout.id}>
                <TableCell>{formatDateTime(payout.created_at)}</TableCell>
                <TableCell>{formatMoney(payout.amount_usd)}</TableCell>
                <TableCell>{payoutMethodLabel(payout.method)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{payoutStatusLabel(payout.status)}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {!payouts.length ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No cash-out requests yet. Finish the steps above when you have approved earnings.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
