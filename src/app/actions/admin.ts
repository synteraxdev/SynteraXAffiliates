"use server";

import { revalidatePath } from "next/cache";
import { getServiceDb } from "@/lib/supabase";
import { requireAdmin } from "@/lib/session";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function saveOffer(formData: FormData) {
  const admin = await requireAdmin();
  const db = getServiceDb();
  const id = String(formData.get("id") || "");
  const payload = {
    name: String(formData.get("name") || "").trim(),
    slug: slugify(String(formData.get("slug") || formData.get("name") || "")),
    description: String(formData.get("description") || "") || null,
    category: String(formData.get("category") || "general"),
    destination_kind: String(formData.get("destination_kind") || "external"),
    destination_value: String(formData.get("destination_value") || "/"),
    link_style: String(formData.get("link_style") || "query"),
    ref_param: String(formData.get("ref_param") || "ref"),
    conversion_type: String(formData.get("conversion_type") || "postback"),
    payout_model: String(formData.get("payout_model") || "cpa"),
    cpa_amount_usd: Number(formData.get("cpa_amount_usd") || 0),
    cpc_amount_usd: Number(formData.get("cpc_amount_usd") || 0),
    revshare_pct: formData.get("revshare_pct") ? Number(formData.get("revshare_pct")) : null,
    cookie_hours: Number(formData.get("cookie_hours") || 720),
    attribution: String(formData.get("attribution") || "last_click"),
    click_cap: formData.get("click_cap") ? Number(formData.get("click_cap")) : null,
    conversion_cap: formData.get("conversion_cap") ? Number(formData.get("conversion_cap")) : null,
    daily_conversion_cap: formData.get("daily_conversion_cap") ? Number(formData.get("daily_conversion_cap")) : null,
    terms: String(formData.get("terms") || "") || null,
    cta_label: String(formData.get("cta_label") || "Get link"),
    is_active: formData.get("is_active") === "on",
    member_visible: formData.get("member_visible") === "on",
    requires_approval: formData.get("requires_approval") === "on",
    sort_order: Number(formData.get("sort_order") || 100),
    updated_at: new Date().toISOString(),
  };

  if (!payload.name || !payload.slug) {
    throw new Error("Name is required");
  }

  if (id) {
    const { error } = await db.from("offers").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await db
      .from("offers")
      .insert({ ...payload, created_by: admin.id })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await db.from("offer_secrets").insert({
      offer_id: data.id,
      secret: Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString("hex"),
    });
  }

  await db.from("audit_log").insert({
    actor_id: admin.id,
    action: id ? "offer.update" : "offer.create",
    entity: "offers",
    entity_id: id || payload.slug,
    detail: { slug: payload.slug },
  });

  revalidatePath("/admin/offers");
  revalidatePath("/offers");
}

export async function rotateOfferSecret(offerId: string) {
  const admin = await requireAdmin();
  const db = getServiceDb();
  const secret = Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString("hex");
  const { error } = await db.from("offer_secrets").upsert({
    offer_id: offerId,
    secret,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  await db.from("audit_log").insert({
    actor_id: admin.id,
    action: "offer.rotate_secret",
    entity: "offer_secrets",
    entity_id: offerId,
  });
  revalidatePath(`/admin/offers/${offerId}`);
  return secret;
}

export async function setConversionStatus(conversionId: string, status: "approved" | "rejected" | "paid") {
  const admin = await requireAdmin();
  const db = getServiceDb();
  const { error } = await db
    .from("conversions")
    .update({
      status,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", conversionId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/conversions");
}

export async function setPayoutStatus(payoutId: string, status: "approved" | "paid" | "rejected") {
  const admin = await requireAdmin();
  const db = getServiceDb();
  const { error } = await db
    .from("payouts")
    .update({
      status,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", payoutId);
  if (error) throw new Error(error.message);

  if (status === "paid") {
    const { data: items } = await db.from("payout_items").select("conversion_id").eq("payout_id", payoutId);
    const ids = (items || []).map((item) => item.conversion_id);
    if (ids.length) {
      await db.from("conversions").update({ status: "paid" }).in("id", ids);
    }
  }

  revalidatePath("/admin/payouts");
}

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  const db = getServiceDb();
  const { error } = await db
    .from("program_settings")
    .update({
      name: String(formData.get("name") || "SynteraX Affiliates"),
      cookie_hours: Number(formData.get("cookie_hours") || 720),
      min_payout_usd: Number(formData.get("min_payout_usd") || 50),
      auto_approve_conversions: formData.get("auto_approve_conversions") === "on",
      default_attribution: String(formData.get("default_attribution") || "last_click"),
      click_velocity_limit: Number(formData.get("click_velocity_limit") || 40),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}

export async function addCreative(formData: FormData) {
  await requireAdmin();
  const db = getServiceDb();
  const { error } = await db.from("offer_creatives").insert({
    offer_id: String(formData.get("offer_id")),
    kind: String(formData.get("kind") || "text"),
    name: String(formData.get("name") || "Creative"),
    body: String(formData.get("body") || ""),
    image_url: String(formData.get("image_url") || "") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/offers/${String(formData.get("offer_id"))}`);
}

export async function resolveFraud(id: string, status: "reviewed" | "dismissed") {
  await requireAdmin();
  const db = getServiceDb();
  await db.from("fraud_events").update({ status }).eq("id", id);
  revalidatePath("/admin/fraud");
}
