import { saveSettings } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSettings } from "@/lib/data";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Program settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Defaults for cookies, payout thresholds, and fraud limits.</p>
      </div>
      <Card className="p-5">
        <form action={saveSettings} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Program name</Label>
            <Input id="name" name="name" defaultValue={settings.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cookie_hours">Default cookie hours</Label>
            <Input id="cookie_hours" name="cookie_hours" type="number" defaultValue={settings.cookie_hours} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="min_payout_usd">Minimum payout USD</Label>
            <Input id="min_payout_usd" name="min_payout_usd" type="number" step="0.01" defaultValue={settings.min_payout_usd} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_attribution">Default attribution</Label>
            <select
              id="default_attribution"
              name="default_attribution"
              defaultValue={settings.default_attribution}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="last_click">last_click</option>
              <option value="first_click">first_click</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="click_velocity_limit">Click velocity limit / minute</Label>
            <Input id="click_velocity_limit" name="click_velocity_limit" type="number" defaultValue={settings.click_velocity_limit} />
          </div>
          <label className="flex items-center gap-3 text-sm md:col-span-2">
            <input
              type="checkbox"
              name="auto_approve_conversions"
              defaultChecked={settings.auto_approve_conversions}
              className="h-4 w-4 accent-primary"
            />
            Auto-approve conversions
          </label>
          <div>
            <Button type="submit">Save settings</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
