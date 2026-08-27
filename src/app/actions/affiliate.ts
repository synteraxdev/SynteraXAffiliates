"use server";

import { revalidatePath } from "next/cache";
import { getServiceDb } from "@/lib/supabase";
import { requireSession } from "@/lib/session";
import { getOfferById, getProfile, getSettings, notifyAdmins } from "@/lib/data";
import { isPayoutMethod, parsePayoutMethod, payoutDestination, payoutMethodLabel } from "@/lib/payouts";

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

export async function requestPayout(formData?: FormData) {
  const user = await requireSession();
  const db = getServiceDb();
  const settings = await getSettings();
  const profile = await getProfile(user.id);
  const requested = formData ? String(formData.get("payout_method") || "") : "";
  const method = isPayoutMethod(requested) ? requested : parsePayoutMethod(profile?.payout_method);
  const { data: conversions, error } = await db
    .from("conversions")
    .select("id, commission_usd")
    .eq("promoter_id", user.id)
    .eq("status", "approved");
  if (error) throw new Error(error.message);
  const ids = (conversions || []).map((row) => row.id);
  const { data: claimed } = ids.length
    ? await db.from("payout_items").select("conversion_id").in("conversion_id", ids)
    : { data: [] };
  const claimedIds = new Set((claimed || []).map((row) => row.conversion_id));
  const available = (conversions || []).filter((row) => !claimedIds.has(row.id));
  const amount = available.reduce((sum, row) => sum + Number(row.commission_usd || 0), 0);
  if (amount < Number(settings.min_payout_usd || 0)) {
    throw new Error(`Minimum payout is $${settings.min_payout_usd}`);
  }
  if (!available.length) {
    throw new Error("No approved commissions available");
  }

  const { data: payout, error: payoutError } = await db
    .from("payouts")
    .insert({
      promoter_id: user.id,
      amount_usd: amount,
      method,
      destination: payoutDestination(method, user.username),
      status: "requested",
    })
    .select("id")
    .single();
  if (payoutError) throw new Error(payoutError.message);

  await db.from("payout_items").insert(
    available.map((row) => ({
      payout_id: payout.id,
      conversion_id: row.id,
    })),
  );
  await notifyAdmins({
    kind: "payout.requested",
    title: "Payout requested",
    body: `${user.username || user.email} requested $${amount.toFixed(2)} as ${payoutMethodLabel(method)}.`,
    entity: "payouts",
    entityId: payout.id,
  });
  revalidatePath("/payouts");
}

export async function savePayoutDetails(formData: FormData) {
  const user = await requireSession();
  const db = getServiceDb();
  const method = parsePayoutMethod(formData.get("payout_method"));
  const { error } = await db
    .from("profiles")
    .update({
      payout_method: method,
      payout_details: {
        kind: method,
        currency: method === "xflow" ? "XFLOW" : "USD",
        network: "synterax",
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/payouts");
}

export async function savePostbackUrl(formData: FormData) {
  const user = await requireSession();
  const db = getServiceDb();
  const postbackUrl = String(formData.get("postback_url") || "").trim();
  if (postbackUrl && !/^https:\/\//i.test(postbackUrl)) {
    throw new Error("Tracker URL must start with https://");
  }
  const { error } = await db
    .from("profiles")
    .update({
      postback_url: postbackUrl || null,
      postback_method: "GET",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/tools");
  revalidatePath("/payouts");
}

export async function applyToOffer(formData: FormData) {
  const user = await requireSession();
  const offerId = String(formData.get("offer_id") || "");
  const accepted = formData.get("accepted_terms") === "on";
  if (!accepted) throw new Error("Accept the offer terms to apply");
  const offer = await getOfferById(offerId);
  if (!offer) throw new Error("Unknown offer");
  const db = getServiceDb();
  const { error } = await db.from("offer_applications").upsert(
    {
      offer_id: offerId,
      profile_id: user.id,
      status: "pending",
      accepted_terms: true,
      note: String(formData.get("note") || "") || null,
    },
    { onConflict: "offer_id,profile_id" },
  );
  if (error) throw new Error(error.message);
  await notifyAdmins({
    kind: "offer.application",
    title: "Offer application",
    body: `${user.username || user.email} applied to ${offer.name}.`,
    entity: "offers",
    entityId: offerId,
  });
  revalidatePath("/offers");
  revalidatePath(`/offers/${offer.slug}`);
  revalidatePath("/admin/applications");
}

export async function createCoupon(formData: FormData) {
  const user = await requireSession();
  const db = getServiceDb();
  const raw = String(formData.get("code") || "").trim().toUpperCase();
  const offerId = String(formData.get("offer_id") || "") || null;
  const code = raw || `${(user.referralSlug || "AFF").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)}20`;
  if (!/^[A-Z0-9_-]{4,32}$/.test(code)) {
    throw new Error("Coupon codes must be 4–32 letters, numbers, _ or -");
  }
  const { error } = await db.from("coupons").insert({
    code,
    offer_id: offerId,
    promoter_id: user.id,
    note: String(formData.get("note") || "") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/offers");
  revalidatePath("/tools");
  if (offerId) {
    const offer = await getOfferById(offerId);
    if (offer) revalidatePath(`/offers/${offer.slug}`);
  }
}

export async function markNotificationsRead() {
  const user = await requireSession();
  const db = getServiceDb();
  await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", user.id)
    .is("read_at", null);
  revalidatePath("/notifications");
}
