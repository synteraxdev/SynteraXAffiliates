import { HelpTip } from "@/components/help-tip";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listConversions } from "@/lib/data";
import { formatMoney } from "@/lib/affiliate";
import { formatDateTime } from "@/lib/format";
import { holdLabel } from "@/lib/network";
import { conversionStatusLabel } from "@/lib/payouts";
import { getSession } from "@/lib/session";

export default async function ConversionsPage() {
  const session = await getSession();
  if (!session) return null;
  const conversions = await listConversions({ promoterId: session.id });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Earnings</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">What you have earned</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          New results sit on hold for a few days. After approval they move to Cash out as Vault USD or XFLOW.
        </p>
      </div>
      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Offer</TableHead>
              <TableHead>You earn</TableHead>
              <TableHead>
                <HelpTip label="Status">Waiting means we are still checking. Ready to cash out means it can be paid.</HelpTip>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversions.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatDateTime(row.created_at)}</TableCell>
                <TableCell>{row.offers?.name}</TableCell>
                <TableCell>{formatMoney(row.commission_usd)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      ["rejected", "refunded", "clawed_back"].includes(row.status) ? "destructive" : "secondary"
                    }
                  >
                    {conversionStatusLabel(row.status, holdLabel(row.held_until, row.status))}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {!conversions.length ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Nothing yet. Share a link from Promote and check back here.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
