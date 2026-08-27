import { notFound } from "next/navigation";
import { applyToOffer, createCoupon } from "@/app/actions/affiliate";
import { CopyButton } from "@/components/copy-button";
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
import { formatMoney, formatPct, payoutLabel, trackingPath } from "@/lib/affiliate";
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
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-3xl font-semibold">{offer.name}</h1>
          <Badge>{payoutLabel(offer.payout_model)}</Badge>
          <Badge variant="secondary">{offer.conversion_type}</Badge>
          <Badge variant="outline">{offer.attribution}</Badge>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{offer.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Info label="CPA" value={formatMoney(offer.cpa_amount_usd)} />
        <Info label="RevShare" value={formatPct(offer.revshare_pct)} />
        <Info label="Cookie / hold" value={`${offer.cookie_hours}h · ${offer.hold_days ?? "program"}d hold`} />
        <Info label="Daily cap left" value={remaining == null ? "Open" : String(remaining)} />
      </div>

      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Targeting</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Geo: {offer.allowed_countries?.length ? offer.allowed_countries.join(", ") : "worldwide"}. Device:{" "}
          {offer.allowed_devices?.length ? offer.allowed_devices.join(", ") : "all"}. Blocked traffic falls through
          to the network smartlink.
        </p>
      </Card>

      {locked ? (
        <Card className="p-5">
          <h2 className="font-heading text-lg font-semibold">Apply for access</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This offer is private. Accept the terms and wait for admin approval before sending traffic.
          </p>
          {offer.terms ? <p className="mt-3 text-sm">{offer.terms}</p> : null}
          {access.application?.status === "pending" ? (
            <Badge className="mt-4" variant="secondary">
              Application pending
            </Badge>
          ) : access.application?.status === "rejected" ? (
            <Badge className="mt-4" variant="destructive">
              Application rejected
            </Badge>
          ) : (
            <form action={applyToOffer} className="mt-4 space-y-3">
              <input type="hidden" name="offer_id" value={offer.id} />
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="accepted_terms" required className="mt-1 h-4 w-4 accent-primary" />
                I accept the offer terms and traffic restrictions.
              </label>
              <Textarea name="note" placeholder="Traffic source / notes" rows={3} />
              <Button type="submit">Apply</Button>
            </form>
          )}
        </Card>
      ) : (
        <>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Your tracking link</p>
            <p className="mt-3 break-all font-mono text-sm">{link}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <CopyButton value={link} label="Copy link" />
              <CopyButton value={utm} label="Copy with UTM" />
              <CopyButton value={`${link}?sub1=youtube&sub2=story`} label="Copy with sub IDs" />
              <CopyButton value={smartlink} label="Copy smartlink" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Smartlink: <span className="font-mono">{smartlink}</span> — routes by geo, device, weight, EPC, and cap.
            </p>
            <img src={qrImageUrl(link)} alt="QR for tracking link" className="mt-4 h-40 w-40 rounded-md border border-border/70 bg-white p-2" />
          </Card>

          {offer.terms ? (
            <Card className="p-5">
              <h2 className="font-heading text-lg font-semibold">Terms</h2>
              <p className="mt-2 text-sm text-muted-foreground">{offer.terms}</p>
            </Card>
          ) : null}

          <Card className="p-5">
            <h2 className="font-heading text-lg font-semibold">Vanity coupon</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use a checkout code when cookies fail (Safari). Inbound postbacks accept <span className="font-mono">coupon=</span>.
            </p>
            <form action={createCoupon} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <input type="hidden" name="offer_id" value={offer.id} />
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" placeholder={`${session.referralSlug?.toUpperCase() || "AFF"}20`} />
              </div>
              <div className="self-end">
                <Button type="submit">Create coupon</Button>
              </div>
            </form>
            <ul className="mt-4 space-y-1 font-mono text-xs text-muted-foreground">
              {coupons.map((coupon) => (
                <li key={coupon.id}>{coupon.code}</li>
              ))}
            </ul>
          </Card>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">Creatives</h2>
            {creatives.map((creative) => {
              const baked = bakeCreative(creative.body, {
                link,
                ref: session.referralSlug,
                offer: offer.slug,
                utmLink: utm,
              });
              return (
                <Card key={creative.id} className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{creative.name}</p>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{creative.kind}</p>
                    </div>
                    <CopyButton value={baked} label="Copy kit" />
                  </div>
                  <pre className="mt-3 overflow-auto rounded-md bg-background/60 p-3 font-mono text-xs whitespace-pre-wrap">
                    {baked}
                  </pre>
                </Card>
              );
            })}
            {!creatives.length ? (
              <p className="text-sm text-muted-foreground">No creatives yet. Your tracking link still works.</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </Card>
  );
}
