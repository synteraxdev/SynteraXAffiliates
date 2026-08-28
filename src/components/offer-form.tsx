import { saveOffer } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Offer } from "@/lib/data";

export function OfferForm({ offer }: { offer?: Offer }) {
  return (
    <form action={saveOffer} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="id" defaultValue={offer?.id || ""} />
      <Field label="Name" name="name" defaultValue={offer?.name} required />
      <Field label="Slug" name="slug" defaultValue={offer?.slug} />
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={offer?.description || ""} rows={3} />
      </div>
      <Field label="Category" name="category" defaultValue={offer?.category || "general"} />
      <SelectField
        label="Destination kind"
        name="destination_kind"
        defaultValue={offer?.destination_kind || "external"}
        options={["internal", "external", "sso_card"]}
      />
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="destination_value">Destination</Label>
        <Input id="destination_value" name="destination_value" defaultValue={offer?.destination_value || "/"} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="preview_image_url">Preview screenshot URL</Label>
        <Input
          id="preview_image_url"
          name="preview_image_url"
          defaultValue={offer?.preview_image_url || ""}
          placeholder="/offers/membership.png"
        />
      </div>
      <SelectField label="Link style" name="link_style" defaultValue={offer?.link_style || "query"} options={["query", "path", "none"]} />
      <Field label="Ref param" name="ref_param" defaultValue={offer?.ref_param || "ref"} />
      <SelectField
        label="Conversion type"
        name="conversion_type"
        defaultValue={offer?.conversion_type || "postback"}
        options={["postback", "js", "pixel", "signup", "plan_order", "none"]}
      />
      <SelectField
        label="Payout model"
        name="payout_model"
        defaultValue={offer?.payout_model || "cpa"}
        options={["none", "cpa", "cpc", "cpl", "revshare", "hybrid"]}
      />
      <Field label="CPA USD" name="cpa_amount_usd" type="number" step="0.01" defaultValue={String(offer?.cpa_amount_usd ?? 0)} />
      <Field label="CPC USD" name="cpc_amount_usd" type="number" step="0.01" defaultValue={String(offer?.cpc_amount_usd ?? 0)} />
      <Field label="RevShare %" name="revshare_pct" type="number" step="0.01" defaultValue={offer?.revshare_pct ? String(offer.revshare_pct) : ""} />
      <Field label="Cookie hours" name="cookie_hours" type="number" defaultValue={String(offer?.cookie_hours ?? 720)} />
      <SelectField
        label="Attribution"
        name="attribution"
        defaultValue={offer?.attribution || "last_click"}
        options={["last_click", "first_click", "linear"]}
      />
      <Field label="Hold days (blank = program default)" name="hold_days" type="number" defaultValue={offer?.hold_days != null ? String(offer.hold_days) : ""} />
      <Field label="Click cap" name="click_cap" type="number" defaultValue={offer?.click_cap ? String(offer.click_cap) : ""} />
      <Field label="Conversion cap" name="conversion_cap" type="number" defaultValue={offer?.conversion_cap ? String(offer.conversion_cap) : ""} />
      <Field label="Daily conversion cap" name="daily_conversion_cap" type="number" defaultValue={offer?.daily_conversion_cap ? String(offer.daily_conversion_cap) : ""} />
      <Field
        label="Allowed countries (ISO, comma-separated)"
        name="allowed_countries"
        defaultValue={(offer?.allowed_countries || []).join(",")}
      />
      <Field
        label="Allowed devices (desktop,mobile,tablet)"
        name="allowed_devices"
        defaultValue={(offer?.allowed_devices || []).join(",")}
      />
      <Field label="Smartlink weight" name="smartlink_weight" type="number" defaultValue={String(offer?.smartlink_weight ?? 100)} />
      <Field label="CTA label" name="cta_label" defaultValue={offer?.cta_label || "Get link"} />
      <Field label="Sort order" name="sort_order" type="number" defaultValue={String(offer?.sort_order ?? 100)} />
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="terms">Terms</Label>
        <Textarea id="terms" name="terms" defaultValue={offer?.terms || ""} rows={3} />
      </div>
      <Toggle name="is_active" label="Active" defaultChecked={offer?.is_active ?? true} />
      <Toggle name="member_visible" label="Visible to affiliates" defaultChecked={offer?.member_visible ?? true} />
      <Toggle name="requires_approval" label="Private / approval required" defaultChecked={offer?.requires_approval ?? false} />
      <Toggle name="smartlink_enabled" label="Include in /go/network smartlink" defaultChecked={offer?.smartlink_enabled ?? true} />
      <div className="md:col-span-2">
        <Button type="submit">{offer ? "Save offer" : "Create offer"}</Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  step,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} step={step} defaultValue={defaultValue} required={required} />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select id={name} name={name} defaultValue={defaultValue} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-border/70 px-3 py-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-primary" />
      {label}
    </label>
  );
}
