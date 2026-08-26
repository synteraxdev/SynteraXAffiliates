"use server";

import { revalidatePath } from "next/cache";
import { getServiceDb } from "@/lib/supabase";
import { requireSession } from "@/lib/session";
import { getSettings } from "@/lib/data";

export async function createTrackingLink(formData: FormData) {
  const user = await requireSession();
  const db = getServiceDb();
  const { error } = await db.from("tracking_links").insert({
    offer_id: String(formData.get("offer_id")),
    promoter_id: user.id,
    name: String(formData.get("name") || "Link"),
    sub1: String(formData.get("sub1") || "") || null,
    sub2: String(formData.get("sub2") || "") || null,
    sub3: String(formData.get("sub3") || "") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/links");
}

export async function requestPayout() {
  const user = await requireSession();
  const db = getServiceDb();
  const settings = await getSettings();
  const { data: conversions, error } = await db
    .from("conversions")
    .select("id, commission_usd")
    .eq("promoter_id", user.id)
    .eq("status", "approved");
  if (error) throw new Error(error.message);
  const amount = (conversions || []).reduce((sum, row) => sum + Number(row.commission_usd || 0), 0);
  if (amount < Number(settings.min_payout_usd || 0)) {
    throw new Error(`Minimum payout is $${settings.min_payout_usd}`);
  }
  if (!(conversions || []).length) {
    throw new Error("No approved commissions available");
  }

  const { data: payout, error: payoutError } = await db
    .from("payouts")
    .insert({
      promoter_id: user.id,
      amount_usd: amount,
      method: "manual",
      destination: user.email ? { email: user.email } : {},
      status: "requested",
    })
    .select("id")
    .single();
  if (payoutError) throw new Error(payoutError.message);

  await db.from("payout_items").insert(
    (conversions || []).map((row) => ({
      payout_id: payout.id,
      conversion_id: row.id,
    })),
  );
  revalidatePath("/payouts");
}

export async function savePayoutDetails(formData: FormData) {
  const user = await requireSession();
  const db = getServiceDb();
  const { error } = await db
    .from("profiles")
    .update({
      payout_method: String(formData.get("payout_method") || "manual"),
      payout_details: {
        wallet: String(formData.get("wallet") || ""),
        note: String(formData.get("note") || ""),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/payouts");
}
