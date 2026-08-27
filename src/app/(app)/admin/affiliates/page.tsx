import { savePayoutOverride, setAffiliateTier } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAffiliates, listTiers, listVisibleOffers } from "@/lib/data";
import { roleLabel } from "@/lib/roles";
import { formatDate } from "@/lib/format";

export default async function AdminAffiliatesPage() {
  const [affiliates, tiers, offers] = await Promise.all([listAffiliates(), listTiers(), listVisibleOffers(true)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Affiliates</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bronze / Silver / Gold default rates, plus per-affiliate payout overrides so you do not edit every offer by
          hand.
        </p>
      </div>
      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {affiliates.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>
                  <p>{profile.full_name || profile.username}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </TableCell>
                <TableCell className="font-mono text-xs">{profile.referral_slug}</TableCell>
                <TableCell>{roleLabel(profile.role)}</TableCell>
                <TableCell>
                  <form action={setAffiliateTier} className="flex items-center gap-2">
                    <input type="hidden" name="profile_id" value={profile.id} />
                    <select
                      name="tier_id"
                      defaultValue={profile.tier_id || ""}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {tiers.map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.name}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" variant="outline">
                      Save
                    </Button>
                  </form>
                </TableCell>
                <TableCell>{formatDate((profile as { created_at?: string }).created_at)}</TableCell>
              </TableRow>
            ))}
            {!affiliates.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No SSO logins yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold">Per-affiliate payout override</h2>
        <p className="mt-2 text-sm text-muted-foreground">Overrides beat the partner tier for that offer.</p>
        <form action={savePayoutOverride} className="mt-4 grid gap-3 md:grid-cols-6">
          <select name="profile_id" className="h-9 rounded-md border border-input bg-background px-3 text-sm" required>
            <option value="">Affiliate</option>
            {affiliates.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.username || profile.email}
              </option>
            ))}
          </select>
          <select name="offer_id" className="h-9 rounded-md border border-input bg-background px-3 text-sm" required>
            <option value="">Offer</option>
            {offers.map((offer) => (
              <option key={offer.id} value={offer.id}>
                {offer.name}
              </option>
            ))}
          </select>
          <Input name="cpa_amount_usd" placeholder="CPA USD" type="number" step="0.01" />
          <Input name="cpc_amount_usd" placeholder="CPC USD" type="number" step="0.01" />
          <Input name="revshare_pct" placeholder="RevShare %" type="number" step="0.01" />
          <Button type="submit">Save override</Button>
        </form>
      </Card>
    </div>
  );
}
