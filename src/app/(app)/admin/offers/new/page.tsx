import { OfferForm } from "@/components/offer-form";
import { Card } from "@/components/ui/card";

export default function NewOfferPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-semibold">New offer</h1>
      <Card className="p-5">
        <OfferForm />
      </Card>
    </div>
  );
}
