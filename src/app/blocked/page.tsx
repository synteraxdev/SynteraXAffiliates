import Link from "next/link";
import { BrandWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { blockedReasonCopy } from "@/lib/network";

export default async function BlockedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; offer?: string; ref?: string; country?: string; network?: string }>;
}) {
  const params = await searchParams;
  const reason = params.reason || "unavailable";

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <BrandWordmark />
        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Offer unavailable</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold">Traffic could not be routed</h1>
          <p className="mt-3 text-sm text-muted-foreground">{blockedReasonCopy(reason)}</p>
          <dl className="mt-5 space-y-2 font-mono text-xs text-muted-foreground">
            {params.offer ? (
              <div className="flex justify-between gap-4">
                <dt>Offer</dt>
                <dd>{params.offer}</dd>
              </div>
            ) : null}
            {params.country ? (
              <div className="flex justify-between gap-4">
                <dt>Country</dt>
                <dd>{params.country}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt>Reason</dt>
              <dd>{reason}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            {params.ref ? (
              <Button asChild>
                <a href={params.network || `/go/network/${params.ref}`}>Try network smartlink</a>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/offers">Browse offers</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
