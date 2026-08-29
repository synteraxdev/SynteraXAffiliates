import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { dashboardStats, listAffiliates, listApplications, listFraudEvents, listVisibleOffers } from "@/lib/data";
import { formatMoney } from "@/lib/affiliate";

export default async function AdminHomePage() {
  const [stats, offers, affiliates, fraud, applications] = await Promise.all([
    dashboardStats(),
    listVisibleOffers(true),
    listAffiliates(),
    listFraudEvents(),
    listApplications({ status: "pending" }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Admin</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">Network control</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage offers, approve conversions, and pay affiliates. This database is dedicated to Affiliates.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Network clicks" value={String(stats.clicks)} />
        <StatCard label="Signups" value={String(stats.signups)} />
        <StatCard label="Paid conversions" value={String(stats.conversions)} />
        <StatCard label="Approved commission" value={formatMoney(stats.approvedEarnings)} />
        <StatCard label="Open fraud events" value={String(fraud.filter((row) => row.status === "open").length)} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Offers</p>
          <p className="mt-2 font-heading text-3xl">{offers.length}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/offers">Manage offers</Link>
          </Button>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Affiliates</p>
          <p className="mt-2 font-heading text-3xl">{affiliates.length}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/affiliates">View affiliates</Link>
          </Button>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Pending conversions</p>
          <p className="mt-2 font-heading text-3xl">{stats.pending}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/conversions">Review queue</Link>
          </Button>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Offer applications</p>
          <p className="mt-2 font-heading text-3xl">{applications.length}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/applications">Review access</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
