import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listVisibleOffers } from "@/lib/data";
import { formatMoney, payoutLabel } from "@/lib/affiliate";

export default async function AdminOffersPage() {
  const offers = await listVisibleOffers(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Offers</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create and pause the programs affiliates can promote.</p>
        </div>
        <Button asChild>
          <Link href="/admin/offers/new">Add offer</Link>
        </Button>
      </div>
      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Offer</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>CPA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell>
                  <p className="font-medium">{offer.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{offer.slug}</p>
                </TableCell>
                <TableCell>{payoutLabel(offer.payout_model)}</TableCell>
                <TableCell>{formatMoney(offer.cpa_amount_usd)}</TableCell>
                <TableCell>
                  <Badge variant={offer.is_active ? "secondary" : "destructive"}>
                    {offer.is_active ? "active" : "paused"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/offers/${offer.id}`}>Edit</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
