import Link from "next/link";
import { ArrowRight, BadgeCheck, Link2, Share2, Wallet } from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  {
    n: "1",
    title: "Sign in with SynteraX",
    body: "Use the same account you already have. No extra password.",
  },
  {
    n: "2",
    title: "Copy a link and share it",
    body: "We make the link for you. Send it in a message, post, or email.",
  },
  {
    n: "3",
    title: "Get paid when people join",
    body: "USD goes into your SynteraX Vault, or take XFLOW tokens. Those are the only two options.",
  },
];

const features = [
  {
    icon: Link2,
    title: "We count the visits",
    body: "Every click on your link is tracked for you. You do not need ads software.",
  },
  {
    icon: Share2,
    title: "Ready-made messages",
    body: "Copy a message, show a QR code, or tap WhatsApp / email. Sharing takes seconds.",
  },
  {
    icon: Wallet,
    title: "Paid like SynteraX",
    body: "Cash out to your Vault in USD or take XFLOW tokens. No banks, no extra wallets.",
  },
  {
    icon: BadgeCheck,
    title: "One login",
    body: "If you can sign in at synterax.io, you can promote here.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <BrandWordmark size="lg" />
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
              Share SynteraX. Get paid when people join.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Copy a link, send it to friends, and earn. We pay into your SynteraX Vault in USD or as XFLOW tokens —
              the same places membership rewards already go.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="/api/auth/login">
                  Start promoting
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/marketplace">See what you can share</Link>
              </Button>
            </div>
          </div>
          <Card className="border-primary/20 bg-card/80 p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">How it works</p>
            <ol className="mt-4 space-y-4">
              {steps.map((step) => (
                <li key={step.n} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                    {step.n}
                  </span>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
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
