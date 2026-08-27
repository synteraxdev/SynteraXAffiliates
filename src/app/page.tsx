import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingFooter, MarketingHeader, MarketingTicker } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const offers = [
  {
    eyebrow: "Membership",
    title: "SynteraX Membership",
    earn: "20% of what they spend",
    body: "The core offer. People join the network, build a record, and earn XFLOW. You earn a share when they stay.",
  },
  {
    eyebrow: "Most shared",
    title: "SynteraX Card",
    earn: "$25–$40 when they get a card",
    body: "Private spend, Apple Pay, Google Pay, worldwide. Members already want this. You get paid when they apply.",
  },
  {
    eyebrow: "Ecosystem",
    title: "XFLOW",
    earn: "$15 plus 5% of what they spend",
    body: "The token members already earn. Share the partner landing and get paid on signup and on activity.",
  },
];

const steps = [
  {
    n: "01",
    title: "Join SynteraX",
    body: "Open a membership. That is the same login you use for every SynteraX product.",
  },
  {
    n: "02",
    title: "Sign in here",
    body: "Use that account. Affiliates never creates a second password.",
  },
  {
    n: "03",
    title: "Share what you already use",
    body: "Pick membership, the card, or XFLOW. Send your link in a message, post, or email.",
  },
  {
    n: "04",
    title: "Get paid",
    body: "USD lands in your SynteraX Vault, or take XFLOW in your Token Vault. Same places membership rewards go.",
  },
];

const problems = [
  {
    title: "You already do the work",
    body: "You tell friends about SynteraX. They join. You get a thank-you. That is not a payout.",
  },
  {
    title: "Most programs feel like a job",
    body: "Dashboards, wallets, tax forms, and offers nobody asked for. People quit before they earn.",
  },
  {
    title: "Payouts go somewhere else",
    body: "Banks, USDT addresses, mystery processors. Another account to babysit.",
  },
  {
    title: "You are selling a stranger’s product",
    body: "If you would not use it, your audience will not either. SynteraX is what you already belong to.",
  },
];

const reasons = [
  {
    title: "Products people actually want",
    body: "Membership, a private card, and XFLOW — not a random coupon site.",
  },
  {
    title: "Same login. No extra password.",
    body: "If you can open synterax.io, you can promote here.",
  },
  {
    title: "Paid where you already get paid",
    body: "Vault in USD or XFLOW tokens. No banks. No extra wallets.",
  },
  {
    title: "Share in a minute",
    body: "Copy a link, send it, done. You do not need ads software.",
  },
];

const faqs = [
  {
    q: "What is SynteraX Affiliates?",
    a: "It is how members get paid for sharing SynteraX. When someone joins or gets a card through your link, you earn.",
  },
  {
    q: "Do I need a new account?",
    a: "No. Use the SynteraX membership you already have. If you do not have one yet, create it first — that is the same login.",
  },
  {
    q: "How do I get paid?",
    a: "USD into your SynteraX Vault, or XFLOW into your Token Vault. Those are the only two options, on purpose.",
  },
  {
    q: "What can I promote?",
    a: "Membership, SynteraX Card, and XFLOW. Browse the offer wall to see what each one pays in plain English.",
  },
  {
    q: "Is there a fee to join?",
    a: "No fee to become an affiliate. You need an active SynteraX membership, then you sign in here.",
  },
];

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      <MarketingTicker />
      <MarketingHeader />

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-primary">Members-only affiliate program</p>
            <h1 className="mt-4 max-w-3xl font-heading text-5xl font-semibold leading-[1.05] sm:text-6xl">
              Get paid to share SynteraX.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              You already tell people about the network. Now when they join, apply for a card, or start earning XFLOW —
              you get paid too.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Affiliates are exclusive to SynteraX members.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="https://synterax.io/signup">
                  Become an Affiliate
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="/api/auth/login">Sign In with SynteraX</a>
              </Button>
            </div>
          </div>
          <Card className="relative overflow-hidden border-primary/25 bg-card/80 p-6">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">What you earn on</p>
            <ul className="mt-5 space-y-4">
              <li className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
                <div>
                  <p className="font-medium">Membership</p>
                  <p className="mt-1 text-sm text-muted-foreground">They join the network</p>
                </div>
                <p className="text-sm text-primary">20% share</p>
              </li>
              <li className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
                <div>
                  <p className="font-medium">SynteraX Card</p>
                  <p className="mt-1 text-sm text-muted-foreground">They spend anywhere, privately</p>
                </div>
                <p className="text-sm text-primary">$25–$40</p>
              </li>
              <li className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">XFLOW</p>
                  <p className="mt-1 text-sm text-muted-foreground">They earn the token you already know</p>
                </div>
                <p className="text-sm text-primary">$15 + 5%</p>
              </li>
            </ul>
            <p className="mt-6 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Paid to your Vault or Token Vault
            </p>
          </Card>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-20">
          <p className="text-xs uppercase tracking-[0.22em] text-primary">Three offers. One membership.</p>
          <h2 className="mt-3 max-w-3xl font-heading text-4xl font-semibold">Share what people already want.</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            You are not selling a mystery product. You are inviting people into SynteraX — membership, the card, and
            XFLOW.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {offers.map((offer) => (
              <Card key={offer.title} className="flex flex-col bg-card/80 p-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-primary">{offer.eyebrow}</p>
                <h3 className="mt-3 font-heading text-2xl font-semibold">{offer.title}</h3>
                <p className="mt-3 text-lg text-primary">{offer.earn}</p>
                <p className="mt-3 flex-1 text-sm text-muted-foreground">{offer.body}</p>
                <Button asChild className="mt-6" variant="outline">
                  <a href="/api/auth/login">Promote this</a>
                </Button>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Want the full list?{" "}
            <Link href="/marketplace" className="text-primary">
              See what you can promote
            </Link>
            .
          </p>
        </section>

        <section className="border-y border-border/60 bg-card/40 py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <p className="text-xs uppercase tracking-[0.22em] text-primary">Member to affiliate in 4 simple steps</p>
            <h2 className="mt-3 font-heading text-4xl font-semibold">No second account. No learning curve.</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-4">
              {steps.map((step) => (
                <div key={step.n}>
                  <p className="font-heading text-3xl text-primary/80">{step.n}</p>
                  <h3 className="mt-3 font-heading text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">The reality</p>
            <h2 className="mt-3 font-heading text-4xl font-semibold">Why does recommending SynteraX pay nothing?</h2>
            <div className="mt-8 space-y-4">
              {problems.map((item) => (
                <Card key={item.title} className="bg-card/80 p-5">
                  <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </Card>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-primary">The SynteraX way</p>
            <h2 className="mt-3 font-heading text-4xl font-semibold">Four reasons members start sharing.</h2>
            <div className="mt-8 space-y-4">
              {reasons.map((item) => (
                <Card key={item.title} className="border-primary/20 bg-card/80 p-5">
                  <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-20">
          <p className="text-xs uppercase tracking-[0.22em] text-primary">How you get paid</p>
          <h2 className="mt-3 font-heading text-4xl font-semibold">Your Vault. Or XFLOW. That’s it.</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Same destinations as SynteraX membership rewards. We do not send money to banks or outside wallets.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Card className="border-primary/25 bg-card/80 p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-primary">USD</p>
              <h3 className="mt-3 font-heading text-2xl font-semibold">SynteraX Vault</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Approved earnings land as dollars in the Vault you already use inside SynteraX.
              </p>
            </Card>
            <Card className="bg-card/80 p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-primary">Tokens</p>
              <h3 className="mt-3 font-heading text-2xl font-semibold">XFLOW Token Vault</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Take XFLOW instead. Converted at the live SynteraX token price, credited where membership XFLOW already
                goes.
              </p>
            </Card>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-6 pb-20">
          <p className="text-xs uppercase tracking-[0.22em] text-primary">Questions, answered</p>
          <h2 className="mt-3 font-heading text-4xl font-semibold">Before you share.</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((item) => (
              <details key={item.q} className="rounded-xl border border-border/70 bg-card/80 p-5">
                <summary className="cursor-pointer font-heading text-lg font-semibold">{item.q}</summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="border-t border-border/60 bg-primary/10 px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-4xl font-semibold sm:text-5xl">Ready to get paid for what you already share?</h2>
            <p className="mt-4 text-muted-foreground">
              Affiliates are exclusive to SynteraX members. Join in under a minute with the same account.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <a href="https://synterax.io/signup">
                  Become an Affiliate
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="/api/auth/login">Sign In with SynteraX</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
