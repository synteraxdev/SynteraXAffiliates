import Link from "next/link";
import { HelpTip } from "@/components/help-tip";
import { OfferPreview } from "@/components/offer-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getOfferAccess, listApplications, listVisibleOffers, offerDailyCap } from "@/lib/data";
import { earnInPlainEnglish, whoCanJoin } from "@/lib/copy";
import { getSession } from "@/lib/session";

function offerStatus(locked: boolean, applicationStatus?: string) {
  if (!locked) return { label: "Open", variant: "secondary" as const };
  if (applicationStatus === "pending") return { label: "Waiting", variant: "outline" as const };
  if (applicationStatus === "rejected") return { label: "Not approved", variant: "destructive" as const };
  return { label: "Ask first", variant: "outline" as const };
}

export default async function OffersPage() {
  const session = await getSession();
  if (!session) return null;
  const offers = await listVisibleOffers(false);
  const applications = await listApplications({ profileId: session.id });
  const appByOffer = new Map(applications.map((row) => [row.offer_id, row]));
  const caps = await Promise.all(offers.map((offer) => offerDailyCap(offer.id, offer.daily_conversion_cap)));
  const accessRows = await Promise.all(offers.map((offer) => getOfferAccess(offer.id, session.id)));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Promote</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">What do you want to share?</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pick a row, get your link, and send it to people. If they join, you earn.
        </p>
      </div>
      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[148px]">
                <HelpTip label="Preview">A screenshot of the page people see when they open your link.</HelpTip>
              </TableHead>
              <TableHead className="min-w-[220px]">Offer</TableHead>
              <TableHead className="min-w-[180px]">
                <HelpTip label="You earn">What you get when someone you sent signs up or spends.</HelpTip>
              </TableHead>
              <TableHead className="min-w-[140px]">
                <HelpTip label="Who can join">Anyone worldwide, unless a country list is shown.</HelpTip>
              </TableHead>
              <TableHead>
                <HelpTip label="Status">Open means you can copy a link now. Ask first means we need to approve you.</HelpTip>
              </TableHead>
              <TableHead>
                <HelpTip label="Spots today">How many signups are left today, if this offer has a daily limit.</HelpTip>
              </TableHead>
              <TableHead className="text-right">Next step</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer, index) => {
              const application = appByOffer.get(offer.id);
              const access = accessRows[index];
              const remaining = caps[index];
              const locked = offer.requires_approval && !access.allowed;
              const status = offerStatus(locked, application?.status);
              return (
                <TableRow key={offer.id}>
                  <TableCell>
                    <Link href={`/offers/${offer.slug}`} className="inline-block">
                      <OfferPreview offer={offer} />
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <Link href={`/offers/${offer.slug}`} className="font-medium hover:text-primary">
                      {offer.name}
                    </Link>
                    {offer.description ? (
                      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{offer.description}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="whitespace-normal font-medium">{earnInPlainEnglish(offer)}</TableCell>
                  <TableCell className="whitespace-normal text-muted-foreground">
                    {whoCanJoin(offer.allowed_countries)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {remaining != null ? remaining : "No daily limit"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm">
                      <Link href={`/offers/${offer.slug}`}>{locked ? "Request access" : "Get my link"}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {!offers.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  No offers are open right now. Check back soon.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
