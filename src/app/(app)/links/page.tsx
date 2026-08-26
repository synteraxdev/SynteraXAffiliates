import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createTrackingLink } from "@/app/actions/affiliate";
import { listTrackingLinks, listVisibleOffers } from "@/lib/data";
import { trackingPath } from "@/lib/affiliate";
import { appOrigin } from "@/lib/env";
import { getSession } from "@/lib/session";

export default async function LinksPage() {
  const session = await getSession();
  if (!session) return null;
  const [offers, links] = await Promise.all([
    listVisibleOffers(false),
    listTrackingLinks(session.id),
  ]);
  const origin = appOrigin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Tracking links</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save named links with default sub IDs so you can split YouTube, email, and paid traffic.
        </p>
      </div>

      <Card className="p-5">
        <form action={createTrackingLink} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="offer_id">Offer</Label>
            <select id="offer_id" name="offer_id" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Link name</Label>
            <Input id="name" name="name" placeholder="YouTube launch" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub1">sub1</Label>
            <Input id="sub1" name="sub1" placeholder="youtube" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub2">sub2</Label>
            <Input id="sub2" name="sub2" placeholder="story-1" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Save link</Button>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Offer</TableHead>
              <TableHead>URL</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => {
              const url = `${origin}${trackingPath(link.offers?.slug || "", session.referralSlug, {
                sub1: link.sub1,
                sub2: link.sub2,
                sub3: link.sub3,
              })}`;
              return (
                <TableRow key={link.id}>
                  <TableCell>{link.name}</TableCell>
                  <TableCell>{link.offers?.name}</TableCell>
                  <TableCell className="max-w-md truncate font-mono text-xs">{url}</TableCell>
                  <TableCell>
                    <CopyButton value={url} />
                  </TableCell>
                </TableRow>
              );
            })}
            {!links.length ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No saved links yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
