import Image from "next/image";
import { notFound } from "next/navigation";
import { applyToOffer, createCoupon } from "@/app/actions/affiliate";
import { ActionForm } from "@/components/action-form";
import { CopyButton } from "@/components/copy-button";
import { HelpTip } from "@/components/help-tip";
import { ShareKit } from "@/components/share-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getOfferAccess,
  getOfferBySlug,
  listCoupons,
  listCreatives,
  offerDailyCap,
} from "@/lib/data";
import { trackingPath } from "@/lib/affiliate";
import { defaultShareMessage, earnInPlainEnglish } from "@/lib/copy";
import { bakeCreative, qrImageUrl, utmTrackingLink } from "@/lib/network";
import { getSession } from "@/lib/session";
import { appOrigin } from "@/lib/env";

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { slug } = await params;
  const offer = await getOfferBySlug(slug);
  if (!offer || (!offer.member_visible && !["admin", "company"].includes(session.role))) notFound();
  const [creatives, access, remaining, coupons] = await Promise.all([
    listCreatives(offer.id),
    getOfferAccess(offer.id, session.id),
    offerDailyCap(offer.id, offer.daily_conversion_cap),
    listCoupons({ promoterId: session.id, offerId: offer.id }),
  ]);
  const origin = appOrigin();
  const link = `${origin}${trackingPath(offer.slug, session.referralSlug)}`;
  const smartlink = `${origin}/go/network/${encodeURIComponent(session.referralSlug)}`;
  const utm = utmTrackingLink(link, offer.slug, session.referralSlug);
  const locked = offer.requires_approval && !access.allowed;

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">Step-by-step</Badge>
        <h1 className="mt-2 font-heading text-3xl font-semibold">{offer.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{offer.description}</p>
        <p className="mt-2 text-sm font-medium">{earnInPlainEnglish(offer)}</p>
      </div>

      {locked ? (
        <Card className="p-5">
          <h2 className="font-heading text-lg font-semibold">This one needs a yes first</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tick the box, send the request, and we will email you in Alerts when it is approved.
          </p>
          {offer.terms ? <p className="mt-3 text-sm">{offer.terms}</p> : null}
          {access.application?.status === "pending" ? (
            <Badge className="mt-4" variant="secondary">
              Waiting for approval
            </Badge>
          ) : access.application?.status === "rejected" ? (
            <Badge className="mt-4" variant="destructive">
              Not approved this time
            </Badge>
          ) : (
            <ActionForm action={applyToOffer} className="mt-4 space-y-3">
              <input type="hidden" name="offer_id" value={offer.id} />
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="accepted_terms" required className="mt-1 h-4 w-4 accent-primary" />
                I understand the rules for this offer.
              </label>
              <Textarea name="note" placeholder="Where will you share this? (optional)" rows={3} />
              <Button type="submit">Ask to promote</Button>
            </ActionForm>
          )}
        </Card>
      ) : (
        <>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-primary">Step 1</p>
            <h2 className="mt-1 font-heading text-lg font-semibold">Copy your personal link</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This already has your name on it. Anyone who clicks it is counted as yours.
            </p>
            <p className="mt-3 break-all rounded-md bg-background/70 p-3 font-mono text-sm">{link}</p>
            <div className="mt-4">
              <ShareKit url={link} title={offer.name} text={defaultShareMessage(offer.name)} />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              <HelpTip label="One link for everything">
                If this page is full or not available in a country, we send the visitor to the next best SynteraX page.
              </HelpTip>
            </p>
            <div className="mt-2">
              <CopyButton value={smartlink} label="Copy my all-in-one link" />
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-primary">Step 2</p>
            <h2 className="mt-1 font-heading text-lg font-semibold">Share it</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Send the link, show the QR, or copy a ready-made message.
            </p>
            <Image
              src={qrImageUrl(link)}
              alt="QR code for your share link"
              width={160}
              height={160}
              unoptimized
              className="mt-4 h-40 w-40 rounded-md border border-border/70 bg-white p-2"
            />
            <div className="mt-4 space-y-3">
              {(creatives.length
                ? creatives.map((creative) => ({
                    id: creative.id,
                    name: creative.name,
                    body: bakeCreative(creative.body, {
                      link,
                      ref: session.referralSlug,
                      offer: offer.slug,
                      utmLink: utm,
                    }),
                  }))
                : [
                    {
                      id: "default",
                      name: "Ready-made message",
                      body: `${defaultShareMessage(offer.name)}\n${link}`,
                    },
                  ]
              ).map((creative) => (
                <div key={creative.id} className="rounded-lg border border-border/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{creative.name}</p>
                    <CopyButton value={creative.body} label="Copy message" />
                  </div>
                  <pre className="mt-2 overflow-auto font-mono text-xs whitespace-pre-wrap text-muted-foreground">
                    {creative.body}
                  </pre>
                </div>
              ))}
            </div>
          </Card>

          <details className="rounded-xl border border-border/70 p-5">
            <summary className="cursor-pointer font-heading text-lg font-semibold">Optional extras</summary>
            <p className="mt-2 text-sm text-muted-foreground">
              Skip this unless someone cannot be tracked with a normal link (for example Safari).
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <ActionForm action={createCoupon} className="contents">
                <input type="hidden" name="offer_id" value={offer.id} />
                <div className="space-y-2">
                  <Label htmlFor="code">Checkout code</Label>
                  <Input id="code" name="code" placeholder={`${session.referralSlug?.toUpperCase() || "AFF"}20`} />
                </div>
                <div className="self-end">
                  <Button type="submit">Save code</Button>
                </div>
              </ActionForm>
            </div>
            <ul className="mt-3 font-mono text-xs text-muted-foreground">
              {coupons.map((coupon) => (
                <li key={coupon.id}>{coupon.code}</li>
              ))}
            </ul>
            {remaining != null ? <p className="mt-3 text-xs text-muted-foreground">Spots left today: {remaining}</p> : null}
          </details>
        </>
      )}
    </div>
  );
}
