"use server";

import { revalidatePath } from "next/cache";
import { getServiceDb } from "@/lib/supabase";
import { requireAdmin } from "@/lib/session";
import { parseCsvList } from "@/lib/network";
import { flushOutboundPostbacks } from "@/lib/outbound";
import { notifyUser, reviewConversion } from "@/lib/data";

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
  const holdRaw = String(formData.get("hold_days") || "").trim();
  const payload = {
    name: String(formData.get("name") || "").trim(),
    slug: slugify(String(formData.get("slug") || formData.get("name") || "")),
    description: String(formData.get("description") || "") || null,
    category: String(formData.get("category") || "general"),
    destination_kind: String(formData.get("destination_kind") || "external"),
    destination_value: String(formData.get("destination_value") || "/"),
    preview_image_url: String(formData.get("preview_image_url") || "").trim() || null,
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
    allowed_countries: parseCsvList(String(formData.get("allowed_countries") || "")),
    allowed_devices: parseCsvList(String(formData.get("allowed_devices") || "")),
    terms: String(formData.get("terms") || "") || null,
    cta_label: String(formData.get("cta_label") || "Get link"),
    is_active: formData.get("is_active") === "on",
    member_visible: formData.get("member_visible") === "on",
    requires_approval: formData.get("requires_approval") === "on",
    smartlink_enabled: formData.get("smartlink_enabled") === "on",
    smartlink_weight: Number(formData.get("smartlink_weight") || 100),
    hold_days: holdRaw ? Number(holdRaw) : null,
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
    const { data: affiliates } = await db
      .from("profiles")
      .select("id")
      .eq("status", "active")
      .in("role", ["distributor", "employee"]);
    for (const affiliate of affiliates || []) {
      await notifyUser({
        profileId: affiliate.id,
        kind: "offer.new",
        title: "New offer available",
        body: `${payload.name} is live in the marketplace.`,
        entity: "offers",
        entityId: data.id,
      });
    }
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
  revalidatePath("/marketplace");
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

export async function setConversionStatus(
  conversionId: string,
  status: "approved" | "rejected" | "paid" | "refunded" | "clawed_back",
  reason?: string,
) {
  const admin = await requireAdmin();
  await reviewConversion({
    id: conversionId,
    status,
    reason,
    actorId: admin.id,
  });
  await flushOutboundPostbacks();
  revalidatePath("/admin/conversions");
  revalidatePath("/conversions");
}

export async function setPayoutStatus(payoutId: string, status: "approved" | "paid" | "rejected") {
  const admin = await requireAdmin();
  const db = getServiceDb();
  const { data: payout, error } = await db
    .from("payouts")
    .update({
      status,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", payoutId)
    .select("id, promoter_id, amount_usd, method")
    .single();
  if (error) throw new Error(error.message);

  if (status === "paid") {
    const { data: items } = await db.from("payout_items").select("conversion_id").eq("payout_id", payoutId);
    const ids = (items || []).map((item) => item.conversion_id);
    if (ids.length) {
      await db.from("conversions").update({ status: "paid" }).in("id", ids);
    }
    if (payout?.promoter_id) {
      await notifyUser({
        profileId: payout.promoter_id,
        kind: "payout.paid",
        title: "Payout sent",
        body: `Your payout of $${Number(payout.amount_usd || 0).toFixed(2)} was sent to your SynteraX ${payout.method === "xflow" ? "XFLOW Token Vault" : "Vault (USD)"}.`,
        entity: "payouts",
        entityId: payoutId,
      });
    }
  }

  revalidatePath("/admin/payouts");
  revalidatePath("/payouts");
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
      hold_days: Number(formData.get("hold_days") || 14),
      smartlink_fallback_slug: String(formData.get("smartlink_fallback_slug") || "lander"),
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
  const { data: event } = await db.from("fraud_events").select("*").eq("id", id).maybeSingle();
  await db.from("fraud_events").update({ status }).eq("id", id);
  if (event?.promoter_id && status === "reviewed") {
    await notifyUser({
      profileId: event.promoter_id,
      kind: "fraud.flag",
      title: "Fraud flag reviewed",
      body: event.reason || "A fraud flag on your traffic was reviewed.",
      entity: "fraud_events",
      entityId: id,
    });
  }
  revalidatePath("/admin/fraud");
}

export async function setAffiliateTier(formData: FormData) {
  const admin = await requireAdmin();
  const db = getServiceDb();
  const profileId = String(formData.get("profile_id") || "");
  const tierId = String(formData.get("tier_id") || "") || null;
  const { error } = await db
    .from("profiles")
    .update({ tier_id: tierId, updated_at: new Date().toISOString() })
    .eq("id", profileId);
  if (error) throw new Error(error.message);
  await db.from("audit_log").insert({
    actor_id: admin.id,
    action: "affiliate.tier",
    entity: "profiles",
    entity_id: profileId,
    detail: { tier_id: tierId },
  });
  revalidatePath("/admin/affiliates");
}

export async function reviewApplication(formData: FormData) {
  const admin = await requireAdmin();
  const db = getServiceDb();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!["approved", "rejected"].includes(status)) {
    throw new Error("Invalid application status");
  }
  const { data: application, error: loadError } = await db
    .from("offer_applications")
    .select("*, offers(name)")
    .eq("id", id)
    .single();
  if (loadError || !application) throw new Error(loadError?.message || "Unknown application");

  const { error } = await db
    .from("offer_applications")
    .update({
      status,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  if (status === "approved") {
    await db.from("offer_access").upsert({
      offer_id: application.offer_id,
      profile_id: application.profile_id,
    });
  }

  await notifyUser({
    profileId: application.profile_id,
    kind: status === "approved" ? "offer.approved" : "offer.rejected",
    title: status === "approved" ? "Offer application approved" : "Offer application rejected",
    body:
      status === "approved"
        ? `You can now promote ${application.offers?.name || "this offer"}.`
        : `Your application for ${application.offers?.name || "this offer"} was rejected.`,
    entity: "offer_applications",
    entityId: id,
  });

  revalidatePath("/admin/applications");
  revalidatePath("/offers");
}

export async function savePayoutOverride(formData: FormData) {
  await requireAdmin();
  const db = getServiceDb();
  const offerId = String(formData.get("offer_id") || "");
  const profileId = String(formData.get("profile_id") || "");
  const cpa = String(formData.get("cpa_amount_usd") || "").trim();
  const cpc = String(formData.get("cpc_amount_usd") || "").trim();
  const rev = String(formData.get("revshare_pct") || "").trim();
  if (!offerId || !profileId) throw new Error("Offer and affiliate are required");
  const { error } = await db.from("offer_payout_overrides").upsert({
    offer_id: offerId,
    profile_id: profileId,
    cpa_amount_usd: cpa ? Number(cpa) : null,
    cpc_amount_usd: cpc ? Number(cpc) : null,
    revshare_pct: rev ? Number(rev) : null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/affiliates");
  revalidatePath(`/admin/offers/${offerId}`);
}
