import Link from "next/link";
import { ArrowRight, BadgeCheck, MousePointerClick, Radio, Wallet } from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: MousePointerClick,
    title: "Click tracking",
    body: "Unique links per offer and affiliate, with sub IDs, device, country, and fraud velocity checks.",
  },
  {
    icon: Radio,
    title: "S2S + pixel conversions",
    body: "Server postbacks, image pixels, and click-id attribution with duplicate protection.",
  },
  {
    icon: Wallet,
    title: "Flexible payouts",
    body: "CPA, CPC, CPL, RevShare, and hybrid offers, plus an approval and payout queue.",
  },
  {
    icon: BadgeCheck,
    title: "SynteraX SSO",
    body: "No second password. Sign in with the same SynteraX account used across the network.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <BrandWordmark />
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <a href="/api/auth/login">Continue with SynteraX</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-24">
        <section className="grid gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-primary">SynteraX Affiliates</p>
            <h1 className="mt-4 max-w-3xl font-heading text-5xl font-semibold leading-[1.05] sm:text-6xl">
              Promote the network. Track every click. Get paid for what converts.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              A dedicated affiliate portal for SynteraX members. Admins publish offers. Affiliates generate links,
              watch live performance, and request payouts — all on the SynteraX identity you already have.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="/api/auth/login">
                  Sign in with SynteraX
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">How SSO works</Link>
              </Button>
            </div>
          </div>
          <Card className="border-primary/20 bg-card/80 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Live program</p>
            <div className="mt-4 space-y-3 font-mono text-sm">
              <Row k="Offers" v="Membership · Card · XFLOW" />
              <Row k="Models" v="CPA · CPC · RevShare · Hybrid" />
              <Row k="Attribution" v="Last click + cookie window" />
              <Row k="Identity" v="synterax.io OIDC" />
            </div>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-card/80 p-5">
              <feature.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-heading text-lg font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span>{v}</span>
    </div>
  );
}
