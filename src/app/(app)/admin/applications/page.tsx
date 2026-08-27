import { reviewApplication } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listApplications } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export default async function AdminApplicationsPage() {
  const applications = await listApplications();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Offer applications</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Private offers stay gated until you approve terms and access.
        </p>
      </div>
      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Affiliate</TableHead>
              <TableHead>Offer</TableHead>
              <TableHead>Terms</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatDateTime(row.created_at)}</TableCell>
                <TableCell>{row.profiles?.username || row.profiles?.email}</TableCell>
                <TableCell>{row.offers?.name}</TableCell>
                <TableCell>{row.accepted_terms ? "Accepted" : "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{row.status}</Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  {row.status === "pending" ? (
                    <>
                      <ReviewButton id={row.id} status="approved" />
                      <ReviewButton id={row.id} status="rejected" />
                    </>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {!applications.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No applications yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ReviewButton({ id, status }: { id: string; status: "approved" | "rejected" }) {
  return (
    <form action={reviewApplication} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" size="sm" variant="outline">
        {status}
      </Button>
    </form>
  );
}
