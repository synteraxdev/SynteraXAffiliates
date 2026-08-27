import { getServiceDb } from "@/lib/supabase";
import { listQueuedOutbound } from "@/lib/data";

export async function flushOutboundPostbacks(limit = 25) {
  const db = getServiceDb();
  const queued = await listQueuedOutbound(limit);
  const results = [];
  for (const row of queued) {
    try {
      const response = await fetch(row.url, { method: "GET", redirect: "follow", cache: "no-store" });
      await db
        .from("outbound_postbacks")
        .update({
          status: response.ok ? "sent" : "failed",
          response_code: response.status,
          attempts: Number(row.attempts || 0) + 1,
          last_error: response.ok ? null : `HTTP ${response.status}`,
          sent_at: response.ok ? new Date().toISOString() : null,
        })
        .eq("id", row.id);
      results.push({ id: row.id, ok: response.ok, status: response.status });
    } catch (error) {
      const message = error instanceof Error ? error.message : "fetch_failed";
      await db
        .from("outbound_postbacks")
        .update({
          status: "failed",
          attempts: Number(row.attempts || 0) + 1,
          last_error: message.slice(0, 300),
        })
        .eq("id", row.id);
      results.push({ id: row.id, ok: false, error: message });
    }
  }
  return results;
}

export async function releaseHeldConversions() {
  const db = getServiceDb();
  const { data, error } = await db.rpc("release_held_conversions");
  if (error) throw new Error(error.message);
  return Number(data || 0);
}
