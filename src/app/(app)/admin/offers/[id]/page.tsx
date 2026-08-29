import { notFound } from "next/navigation";
import { addCreative, rotateOfferSecret } from "@/app/actions/admin";
import { CopyButton } from "@/components/copy-button";
import { OfferForm } from "@/components/offer-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JsTrackingSnippets } from "@/components/js-tracking-snippets";
import { getOfferById, getOfferSecret, listCreatives } from "@/lib/data";
import { appOrigin } from "@/lib/env";

export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offer = await getOfferById(id);
  if (!offer) notFound();
  const [secret, creatives] = await Promise.all([getOfferSecret(offer.id), listCreatives(offer.id)]);
  const origin = appOrigin();
  const postback = `${origin}/t/postback?offer=${offer.slug}&secret=${secret || "SECRET"}&click_id={clickid}&type=paid&external_id={txn}&amount={payout}&status=approved`;
  const signupPostback = `${origin}/t/postback?offer=${offer.slug}&secret=${secret || "SECRET"}&click_id={clickid}&type=signup&external_id={userid}`;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-semibold">Edit {offer.name}</h1>
      <Card className="p-5">
        <OfferForm offer={offer} />
      </Card>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Server-to-server postback</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Use this when the advertiser can fire a server postback. Keep the secret off public pages.
        </p>
        <p className="mt-2 break-all font-mono text-sm">{secret || "No secret yet"}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {secret ? <CopyButton value={secret} label="Copy secret" /> : null}
          <form
            action={async () => {
              "use server";
              await rotateOfferSecret(offer.id);
            }}
          >
            <Button type="submit" variant="outline">
              Rotate secret
            </Button>
          </form>
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">Signup</p>
        <pre className="mt-2 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{signupPostback}</pre>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">Paid</p>
        <pre className="mt-2 overflow-auto rounded-md bg-background/70 p-3 font-mono text-xs">{postback}</pre>
      </Card>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">JavaScript tracking</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          For companies that will not change their backend. Track click, signup, and paid from the browser. Works with
          React and Next.js. Partner-facing copy is at{" "}
          <a href="/docs/javascript" className="text-primary hover:underline">
            /docs/javascript
          </a>
          .
        </p>
        <p className="mt-3 font-mono text-xs text-muted-foreground">{origin}/t/sx.js</p>
        <div className="mt-4">
          <JsTrackingSnippets origin={origin} offerSlug={offer.slug} />
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Add creative</h2>
        <form action={addCreative} className="mt-4 grid gap-3">
          <input type="hidden" name="offer_id" value={offer.id} />
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kind">Kind</Label>
            <select id="kind" name="kind" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="text">text</option>
              <option value="email">email</option>
              <option value="html">html / banner</option>
              <option value="image">image</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              name="body"
              rows={4}
              placeholder="Use {{link}} {{ref}} {{offer}} {{utm}} — we bake the affiliate /go URL on copy."
            />
          </div>
          <Button type="submit">Add creative</Button>
        </form>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          {creatives.map((creative) => (
            <p key={creative.id}>
              {creative.kind}: {creative.name}
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
}
