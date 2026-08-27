"use client";

import { useState } from "react";
import { requestPayout, savePayoutDetails } from "@/app/actions/affiliate";
import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/affiliate";
import { PAYOUT_METHODS, type PayoutMethod, payoutMethodHelp, payoutMethodLabel } from "@/lib/payouts";

export function PayoutWizard({
  available,
  minimum,
  currentMethod,
}: {
  available: number;
  minimum: number;
  currentMethod: PayoutMethod;
}) {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<PayoutMethod>(currentMethod);
  const ready = available >= minimum && available > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <span className={step === 1 ? "text-primary" : ""}>1. Where to pay</span>
        <span>→</span>
        <span className={step === 2 ? "text-primary" : ""}>2. Confirm</span>
        <span>→</span>
        <span className={step === 3 ? "text-primary" : ""}>3. Request</span>
      </div>

      {step === 1 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {PAYOUT_METHODS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMethod(option)}
              className={`rounded-xl border p-4 text-left transition ${
                method === option ? "border-primary bg-primary/10" : "border-border/70 hover:border-primary/50"
              }`}
            >
              <p className="font-heading text-lg font-semibold">{payoutMethodLabel(option)}</p>
              <p className="mt-2 text-sm text-muted-foreground">{payoutMethodHelp(option)}</p>
            </button>
          ))}
          <ActionForm
            action={async (formData) => {
              await savePayoutDetails(formData);
              setStep(2);
            }}
            className="md:col-span-2"
          >
            <input type="hidden" name="payout_method" value={method} />
            <Button type="submit">Use {payoutMethodLabel(method)}</Button>
          </ActionForm>
        </div>
      ) : null}

      {step === 2 ? (
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Ready to cash out</p>
          <p className="mt-1 font-heading text-3xl">{formatMoney(available)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Destination: <strong className="text-foreground">{payoutMethodLabel(method)}</strong>. Minimum is{" "}
            {formatMoney(minimum)}.
          </p>
          {!ready ? (
            <p className="mt-4 text-sm text-amber-400">
              Keep sharing until you reach {formatMoney(minimum)}. Approved earnings then move here.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Change destination
            </Button>
            <Button type="button" disabled={!ready} onClick={() => setStep(3)}>
              Continue
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="p-5">
          <h2 className="font-heading text-lg font-semibold">Send the request</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We will ask SynteraX to pay {formatMoney(available)} as {payoutMethodLabel(method)}. Nothing leaves until an
            admin confirms.
          </p>
          <ActionForm
            action={async (formData) => {
              await requestPayout(formData);
              setStep(1);
            }}
            className="mt-4"
          >
            <input type="hidden" name="payout_method" value={method} />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="submit">Request {payoutMethodLabel(method)}</Button>
            </div>
          </ActionForm>
        </Card>
      ) : null}
    </div>
  );
}
