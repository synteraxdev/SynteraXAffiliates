import { createCoupon } from "@/app/actions/affiliate";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProfile, listCoupons, listVisibleOffers } from "@/lib/data";
import { appOrigin } from "@/lib/env";
import { getSession } from "@/lib/session";

export default async function ToolsPage() {
  const session = await getSession();
  if (!session) return null;
  const [profile, coupons, offers] = await Promise.all([
    getProfile(session.id),
    listCoupons({ promoterId: session.id }),
    listVisibleOffers(false),
  ]);
  const origin = appOrigin();
  const postback = `${origin}/t/postback?offer=YOUR_SLUG&secret=OFFER_SECRET&click_id={clickid}&external_id={txn}&amount={payout}&status=approved&coupon=`;
  const pixel = `${origin}/t/pixel?sx_click={clickid}&amount={payout}`;
  const smartlink = `${origin}/go/network/${encodeURIComponent(session.referralSlug)}`;
  const outbound = profile?.postback_url || "https://your-tracker.example/postback?cid={clickid}&payout={payout}&status={status}";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Tracking tools</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Inbound postbacks, outbound Voluum/Binom hits, smartlink, and vanity coupons.
        </p>
      </div>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Network smartlink</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          One link that routes by geo, device, weight, EPC, and cap. Capped or geo-blocked offers fall through to the
          lander.
        </p>
        <pre className="mt-4 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{smartlink}</pre>
        <CopyButton value={smartlink} />
      </Card>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Inbound S2S postback</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          GET or POST from our landers. Duplicate <span className="font-mono">external_id</span> values are ignored.
          Pass <span className="font-mono">coupon</span> when cookies fail.
        </p>
        <pre className="mt-4 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{postback}</pre>
        <div className="mt-3">
          <CopyButton value={postback} />
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Outbound affiliate postback</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We fire your tracker URL on pending / approved / rejected / refunded. Set it on the Payouts page.
        </p>
        <pre className="mt-4 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{outbound}</pre>
        <CopyButton value={outbound} />
      </Card>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Conversion pixel</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Fire a 1×1 GIF on thank-you pages when you cannot send a server postback.
        </p>
        <pre className="mt-4 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{`<img src="${pixel}" width="1" height="1" alt="" />`}</pre>
        <CopyButton value={`<img src="${pixel}" width="1" height="1" alt="" />`} />
      </Card>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Vanity coupons</h2>
        <form action={createCoupon} className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" placeholder="TESTHOOK20" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offer_id">Offer (optional)</Label>
            <select id="offer_id" name="offer_id" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Any offer</option>
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="self-end">
            <Button type="submit">Create coupon</Button>
          </div>
        </form>
        <ul className="mt-4 space-y-1 font-mono text-xs text-muted-foreground">
          {coupons.map((coupon) => (
            <li key={coupon.id}>
              {coupon.code}
              {coupon.offers?.slug ? ` · ${coupon.offers.slug}` : ""}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Click macros</h2>
        <ul className="mt-3 space-y-2 font-mono text-sm text-muted-foreground">
          <li>sx_click — unique click id placed on the destination URL</li>
          <li>ref / aff_id — your referral slug ({session.referralSlug})</li>
          <li>sub1, sub2, sub3 — campaign tokens</li>
          <li>sx_vid — visitor cookie used for first/last/linear attribution</li>
        </ul>
      </Card>
    </div>
  );
}
