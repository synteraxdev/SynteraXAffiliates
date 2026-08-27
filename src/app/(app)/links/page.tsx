import { createTrackingLink } from "@/app/actions/affiliate";
import { ActionForm } from "@/components/action-form";
import { CopyButton } from "@/components/copy-button";
import { HelpTip } from "@/components/help-tip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listTrackingLinks, listVisibleOffers } from "@/lib/data";
import { trackingPath } from "@/lib/affiliate";
import { appOrigin } from "@/lib/env";
import { getSession } from "@/lib/session";

export default async function LinksPage() {
  const session = await getSession();
  if (!session) return null;
  const [offers, links] = await Promise.all([listVisibleOffers(false), listTrackingLinks(session.id)]);
  const origin = appOrigin();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">My links</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">Name the places you share</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Optional. Make one link for Instagram and another for email so you can see which one works.
        </p>
      </div>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-primary">Create a named link</p>
        <ActionForm action={createTrackingLink} className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="offer_id">What are you sharing?</Label>
            <select id="offer_id" name="offer_id" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name this link</Label>
            <Input id="name" name="name" placeholder="Instagram story" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub1">
              <HelpTip label="Where will you post it?">A short tag like instagram or email. You can leave it blank.</HelpTip>
            </Label>
            <Input id="sub1" name="sub1" placeholder="instagram" />
          </div>
          <div className="self-end">
            <Button type="submit">Save link</Button>
          </div>
        </ActionForm>
      </Card>

      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Offer</TableHead>
              <TableHead>Link</TableHead>
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
                    <CopyButton value={url} label="Copy" />
                  </TableCell>
                </TableRow>
              );
            })}
            {!links.length ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No named links yet. Your main offer links on Promote still work.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
