import { createCoupon, savePostbackUrl } from "@/app/actions/affiliate";
import { ActionForm } from "@/components/action-form";
import { CopyButton } from "@/components/copy-button";
import { HelpTip } from "@/components/help-tip";
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
  const smartlink = `${origin}/go/network/${encodeURIComponent(session.referralSlug)}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Help</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">How this works</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          You do not need ads software. Copy a link, share it, and cash out to your Vault or in XFLOW.
        </p>
      </div>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Your one link for everything</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          If you are unsure which offer to pick, share this. We route people to the best available page.
        </p>
        <pre className="mt-4 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{smartlink}</pre>
        <CopyButton value={smartlink} label="Copy my all-in-one link" />
      </Card>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Backup checkout code</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Only needed if a friend says the link did not stick. They can type this code at checkout instead.
        </p>
        <ActionForm action={createCoupon} className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" placeholder="LEWIS20" />
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
            <Button type="submit">Save code</Button>
          </div>
        </ActionForm>
        <ul className="mt-4 space-y-1 font-mono text-xs text-muted-foreground">
          {coupons.map((coupon) => (
            <li key={coupon.id}>
              {coupon.code}
              {coupon.offers?.slug ? ` · ${coupon.offers.slug}` : ""}
            </li>
          ))}
        </ul>
      </Card>
      <details className="rounded-xl border border-border/70 p-5">
        <summary className="cursor-pointer font-heading text-lg font-semibold">
          For ad buyers (Voluum / Binom)
        </summary>
        <p className="mt-2 text-sm text-muted-foreground">
          Most affiliates can ignore this. If you run a tracker, paste the URL we should hit with click id, payout, and
          status.
        </p>
        <ActionForm action={savePostbackUrl} className="mt-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="postback_url">
              <HelpTip label="Your tracker URL">We replace {"{clickid}"}, {"{payout}"}, and {"{status}"} automatically.</HelpTip>
            </Label>
            <Input
              id="postback_url"
              name="postback_url"
              defaultValue={profile?.postback_url || ""}
              placeholder="https://tracker.example/postback?cid={clickid}&payout={payout}&status={status}"
            />
          </div>
          <Button type="submit" variant="outline">
            Save tracker URL
          </Button>
        </ActionForm>
      </details>
    </div>
  );
}
