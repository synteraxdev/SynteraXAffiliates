import { getServiceDb } from "@/lib/supabase";
import type { SessionUser } from "@/lib/session";
import type { SynteraRole, SynteraStatus } from "@/lib/roles";

export type Offer = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  destination_kind: string;
  destination_value: string;
  link_style: string;
  ref_param: string;
  conversion_type: string;
  payout_model: string;
  cpa_amount_usd: number;
  cpc_amount_usd: number;
  revshare_pct: number | null;
  cookie_hours: number;
  attribution: string;
  click_cap: number | null;
  conversion_cap: number | null;
  daily_conversion_cap: number | null;
  allowed_countries: string[] | null;
  preview_image_url: string | null;
  terms: string | null;
  cta_label: string;
  is_active: boolean;
  member_visible: boolean;
  requires_approval: boolean;
  sort_order: number;
};

export type Profile = {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  role: SynteraRole;
  status: SynteraStatus;
  referral_slug: string | null;
  payout_method: string;
  payout_details: Record<string, unknown>;
};

export async function upsertSsoProfile(input: {
  id: string;
  email?: string | null;
  username?: string | null;
  name?: string | null;
  role?: string | null;
  status?: string | null;
}): Promise<SessionUser> {
  const db = getServiceDb();
  const { data, error } = await db.rpc("upsert_sso_profile", {
    p_id: input.id,
    p_email: input.email ?? null,
    p_username: input.username ?? null,
    p_full_name: input.name ?? null,
    p_role: input.role ?? "distributor",
    p_status: input.status ?? "active",
  });
  if (error) throw new Error(error.message);
  const row = data as Profile;
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    name: row.full_name,
    role: row.role,
    status: row.status,
    referralSlug: row.referral_slug || row.username || row.id.slice(0, 8),
  };
}

export async function listVisibleOffers(isAdmin: boolean): Promise<Offer[]> {
  const db = getServiceDb();
  let query = db.from("offers").select("*").order("sort_order").order("name");
  if (!isAdmin) {
    query = query.eq("is_active", true).eq("member_visible", true);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as Offer[];
}

export async function getOfferBySlug(slug: string): Promise<Offer | null> {
  const db = getServiceDb();
  const { data, error } = await db.from("offers").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Offer) || null;
}

export async function getOfferById(id: string): Promise<Offer | null> {
  const db = getServiceDb();
  const { data, error } = await db.from("offers").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Offer) || null;
}

export async function recordClick(input: {
  offerSlug: string;
  ref: string;
  origin?: string;
  userAgent?: string;
  referer?: string;
  ipHash?: string;
  country?: string;
  device?: string;
  sub1?: string;
  sub2?: string;
  sub3?: string;
}) {
  const db = getServiceDb();
  const { data, error } = await db.rpc("record_click", {
    p_offer_slug: input.offerSlug,
    p_ref_slug: input.ref,
    p_origin: input.origin ?? null,
    p_user_agent: input.userAgent ?? null,
    p_referer: input.referer ?? null,
    p_ip_hash: input.ipHash ?? null,
    p_country: input.country ?? null,
    p_device: input.device ?? null,
    p_sub1: input.sub1 ?? null,
    p_sub2: input.sub2 ?? null,
    p_sub3: input.sub3 ?? null,
  });
  if (error) throw new Error(error.message);
  return data as { click_id: string; destination_url: string; ref: string; offer_slug: string; flagged: boolean };
}

export async function recordPostback(input: {
  offer?: string;
  secret: string;
  clickId?: string;
  ref?: string;
  externalId?: string;
  amountUsd?: number;
  status?: string;
}) {
  const db = getServiceDb();
  const { data, error } = await db.rpc("record_postback", {
    p_offer_slug: input.offer ?? "",
    p_secret: input.secret,
    p_click_id: input.clickId ?? null,
    p_ref_slug: input.ref ?? null,
    p_external_id: input.externalId ?? null,
    p_amount_usd: input.amountUsd ?? 0,
    p_status: input.status ?? "pending",
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function recordConversionFromClick(input: {
  clickId: string;
  conversionType?: string;
  externalId?: string;
  amountUsd?: number;
  metadata?: Record<string, unknown>;
}) {
  const db = getServiceDb();
  const { data, error } = await db.rpc("record_conversion", {
    p_click_id: input.clickId,
    p_conversion_type: input.conversionType ?? null,
    p_external_id: input.externalId ?? null,
    p_amount_usd: input.amountUsd ?? 0,
    p_metadata: input.metadata ?? {},
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function dashboardStats(promoterId?: string) {
  const db = getServiceDb();
  const clickQuery = db.from("clicks").select("id, flagged, created_at, offer_id, promoter_id", { count: "exact" });
  const convQuery = db.from("conversions").select("id, status, commission_usd, amount_usd, created_at, offer_id, promoter_id", { count: "exact" });
  if (promoterId) {
    clickQuery.eq("promoter_id", promoterId);
    convQuery.eq("promoter_id", promoterId);
  }
  const [{ count: clickCount }, { data: conversions }] = await Promise.all([clickQuery, convQuery]);
  const rows = conversions || [];
  const approved = rows.filter((row) => row.status === "approved" || row.status === "paid");
  const pending = rows.filter((row) => row.status === "pending");
  const paid = rows.filter((row) => row.status === "paid");
  const commission = (list: typeof rows) => list.reduce((sum, row) => sum + Number(row.commission_usd || 0), 0);
  return {
    clicks: clickCount || 0,
    conversions: rows.length,
    pending: pending.length,
    approved: approved.length,
    pendingEarnings: commission(pending),
    approvedEarnings: commission(approved),
    paidEarnings: commission(paid),
  };
}

export async function listClicks(opts: { promoterId?: string; limit?: number }) {
  const db = getServiceDb();
  let query = db
    .from("clicks")
    .select("*, offers(name, slug)")
    .order("created_at", { ascending: false })
    .limit(opts.limit || 50);
  if (opts.promoterId) query = query.eq("promoter_id", opts.promoterId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function listConversions(opts: { promoterId?: string; status?: string; limit?: number }) {
  const db = getServiceDb();
  let query = db
    .from("conversions")
    .select("*, offers(name, slug), profiles!conversions_promoter_id_fkey(username, referral_slug, email)")
    .order("created_at", { ascending: false })
    .limit(opts.limit || 100);
  if (opts.promoterId) query = query.eq("promoter_id", opts.promoterId);
  if (opts.status) query = query.eq("status", opts.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function offerPerformance(promoterId?: string) {
  const db = getServiceDb();
  const offers = await listVisibleOffers(true);
  const results = await Promise.all(
    offers.map(async (offer) => {
      let clickQuery = db.from("clicks").select("id", { count: "exact", head: true }).eq("offer_id", offer.id);
      let convQuery = db.from("conversions").select("commission_usd, status").eq("offer_id", offer.id);
      if (promoterId) {
        clickQuery = clickQuery.eq("promoter_id", promoterId);
        convQuery = convQuery.eq("promoter_id", promoterId);
      }
      const [{ count }, { data: conversions }] = await Promise.all([clickQuery, convQuery]);
      const rows = conversions || [];
      const commission = rows
        .filter((row) => row.status !== "rejected")
        .reduce((sum, row) => sum + Number(row.commission_usd || 0), 0);
      return {
        ...offer,
        clicks: count || 0,
        conversions: rows.length,
        commission,
      };
    }),
  );
  return results;
}

export async function listCreatives(offerId: string) {
  const db = getServiceDb();
  const { data, error } = await db.from("offer_creatives").select("*").eq("offer_id", offerId).order("created_at");
  if (error) throw new Error(error.message);
  return data || [];
}

export async function listPayouts(promoterId?: string) {
  const db = getServiceDb();
  let query = db
    .from("payouts")
    .select("*, profiles!payouts_promoter_id_fkey(username, email, referral_slug)")
    .order("created_at", { ascending: false });
  if (promoterId) query = query.eq("promoter_id", promoterId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function listAffiliates() {
  const db = getServiceDb();
  const { data, error } = await db.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Profile[];
}

export async function getSettings() {
  const db = getServiceDb();
  const { data, error } = await db.from("program_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listFraudEvents() {
  const db = getServiceDb();
  const { data, error } = await db.from("fraud_events").select("*, offers(name, slug)").order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getOfferSecret(offerId: string): Promise<string | null> {
  const db = getServiceDb();
  const { data } = await db.from("offer_secrets").select("secret").eq("offer_id", offerId).maybeSingle();
  return data?.secret ?? null;
}

export async function listTrackingLinks(promoterId: string) {
  const db = getServiceDb();
  const { data, error } = await db
    .from("tracking_links")
    .select("*, offers(name, slug)")
    .eq("promoter_id", promoterId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function reportByDay(promoterId?: string, days = 14) {
  const db = getServiceDb();
  const since = new Date(Date.now() - days * 86400000).toISOString();
  let clickQuery = db.from("clicks").select("created_at").gte("created_at", since);
  let convQuery = db.from("conversions").select("created_at, commission_usd, status").gte("created_at", since);
  if (promoterId) {
    clickQuery = clickQuery.eq("promoter_id", promoterId);
    convQuery = convQuery.eq("promoter_id", promoterId);
  }
  const [{ data: clicks }, { data: conversions }] = await Promise.all([clickQuery, convQuery]);
  const map = new Map<string, { date: string; clicks: number; conversions: number; commission: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    map.set(date, { date, clicks: 0, conversions: 0, commission: 0 });
  }
  for (const click of clicks || []) {
    const date = String(click.created_at).slice(0, 10);
    const row = map.get(date);
    if (row) row.clicks += 1;
  }
  for (const conversion of conversions || []) {
    const date = String(conversion.created_at).slice(0, 10);
    const row = map.get(date);
    if (row) {
      row.conversions += 1;
      if (conversion.status !== "rejected") row.commission += Number(conversion.commission_usd || 0);
    }
  }
  return [...map.values()];
}
