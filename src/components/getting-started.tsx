import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function GettingStarted({
  hasLink,
  hasClick,
  hasPayoutMethod,
}: {
  hasLink: boolean;
  hasClick: boolean;
  hasPayoutMethod: boolean;
}) {
  const steps = [
    {
      done: true,
      title: "You are signed in",
      body: "Your SynteraX account is your affiliate account. No extra password.",
    },
    {
      done: hasLink,
      title: "Copy a share link",
      body: "Pick an offer and copy the link we make for you. That is all people need to click.",
      href: "/offers",
      cta: "Choose an offer",
    },
    {
      done: hasClick,
      title: "Share it anywhere",
      body: "Send it in a message, post, or email. We count the visits for you.",
    },
    {
      done: hasPayoutMethod,
      title: "Choose how you get paid",
      body: "USD into your SynteraX Vault, or XFLOW tokens. Those are the only two options.",
      href: "/payouts",
      cta: "Set payout",
    },
  ];

  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-primary">Start here</p>
      <h2 className="mt-2 font-heading text-xl font-semibold">Your checklist</h2>
      <ol className="mt-4 space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <div className="mt-0.5">
              {step.done ? <Check className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div>
              <p className="font-medium">
                {index + 1}. {step.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              {step.href && !step.done ? (
                <Button asChild size="sm" className="mt-2">
                  <Link href={step.href}>{step.cta}</Link>
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
