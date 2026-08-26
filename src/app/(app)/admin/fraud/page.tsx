import { resolveFraud } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listFraudEvents } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export default async function FraudPage() {
  const events = await listFraudEvents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Fraud review</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Click-velocity spikes and other automated flags. Review before paying related conversions.
        </p>
      </div>
      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Offer</TableHead>
              <TableHead>Click</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{formatDateTime(event.created_at)}</TableCell>
                <TableCell>{event.reason}</TableCell>
                <TableCell>{event.offers?.name}</TableCell>
                <TableCell className="font-mono text-xs">{event.click_id?.slice(0, 12)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{event.status}</Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <FraudAction id={event.id} status="reviewed" />
                  <FraudAction id={event.id} status="dismissed" />
                </TableCell>
              </TableRow>
            ))}
            {!events.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No fraud events.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function FraudAction({ id, status }: { id: string; status: "reviewed" | "dismissed" }) {
  return (
    <form
      action={async () => {
        "use server";
        await resolveFraud(id, status);
      }}
      className="inline"
    >
      <Button type="submit" size="sm" variant="outline">
        {status}
      </Button>
    </form>
  );
}
