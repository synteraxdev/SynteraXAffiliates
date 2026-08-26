import { setPayoutStatus } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listPayouts } from "@/lib/data";
import { formatMoney } from "@/lib/affiliate";
import { formatDateTime } from "@/lib/format";

export default async function AdminPayoutsPage() {
  const payouts = await listPayouts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Payout queue</h1>
        <p className="mt-2 text-sm text-muted-foreground">Approve or mark payouts paid after you send funds.</p>
      </div>
      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Affiliate</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.map((payout) => (
              <TableRow key={payout.id}>
                <TableCell>{formatDateTime(payout.created_at)}</TableCell>
                <TableCell>{payout.profiles?.username || payout.profiles?.email}</TableCell>
                <TableCell>{formatMoney(payout.amount_usd)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{payout.status}</Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <PayoutAction id={payout.id} status="approved" />
                  <PayoutAction id={payout.id} status="paid" />
                  <PayoutAction id={payout.id} status="rejected" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function PayoutAction({ id, status }: { id: string; status: "approved" | "paid" | "rejected" }) {
  return (
    <form
      action={async () => {
        "use server";
        await setPayoutStatus(id, status);
      }}
      className="inline"
    >
      <Button type="submit" size="sm" variant="outline">
        {status}
      </Button>
    </form>
  );
}
