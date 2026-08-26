import { setConversionStatus } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listConversions } from "@/lib/data";
import { formatMoney } from "@/lib/affiliate";
import { formatDateTime } from "@/lib/format";

export default async function AdminConversionsPage() {
  const conversions = await listConversions({ limit: 150 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Conversion review</h1>
        <p className="mt-2 text-sm text-muted-foreground">Approve, reject, or mark conversions paid.</p>
      </div>
      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Affiliate</TableHead>
              <TableHead>Offer</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversions.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatDateTime(row.created_at)}</TableCell>
                <TableCell>{row.profiles?.username || row.profiles?.email}</TableCell>
                <TableCell>{row.offers?.name}</TableCell>
                <TableCell>{formatMoney(row.commission_usd)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{row.status}</Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <InlineAction id={row.id} status="approved" />
                  <InlineAction id={row.id} status="rejected" />
                  <InlineAction id={row.id} status="paid" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function InlineAction({ id, status }: { id: string; status: "approved" | "rejected" | "paid" }) {
  return (
    <form
      action={async () => {
        "use server";
        await setConversionStatus(id, status);
      }}
      className="inline"
    >
      <Button type="submit" size="sm" variant="outline">
        {status}
      </Button>
    </form>
  );
}
