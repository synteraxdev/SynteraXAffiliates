import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listConversions } from "@/lib/data";
import { formatMoney } from "@/lib/affiliate";
import { formatDateTime } from "@/lib/format";
import { holdLabel } from "@/lib/network";
import { getSession } from "@/lib/session";

export default async function ConversionsPage() {
  const session = await getSession();
  if (!session) return null;
  const conversions = await listConversions({ promoterId: session.id });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Conversions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          New conversions sit on hold before they become payable. Refunds and clawbacks reverse unpaid or paid
          commission.
        </p>
      </div>
      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Offer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversions.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatDateTime(row.created_at)}</TableCell>
                <TableCell>{row.offers?.name}</TableCell>
                <TableCell className="font-mono text-xs">{row.conversion_type}</TableCell>
                <TableCell>{formatMoney(row.amount_usd)}</TableCell>
                <TableCell>{formatMoney(row.commission_usd)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      ["rejected", "refunded", "clawed_back"].includes(row.status) ? "destructive" : "secondary"
                    }
                  >
                    {holdLabel(row.held_until, row.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {!conversions.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No conversions yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
