// Envoi de notifications Web Push.
//
// Appel autorisé par :
//   - le trigger SQL (header  x-push-secret = PUSH_WEBHOOK_SECRET)
//   - un admin connecté (Authorization: Bearer <jwt>) -> permet aussi le broadcast
//
// Body : { user_id?: string (profiles.id), broadcast?: boolean, title, body, url?, tag? }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-push-secret",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ---- Autorisation ----
  const expectedSecret = Deno.env.get("PUSH_WEBHOOK_SECRET");
  const givenSecret = req.headers.get("x-push-secret");
  let isAdmin = false;
  const trusted = !!expectedSecret && givenSecret === expectedSecret;

  if (!trusted) {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);
    const { data: u } = await supabase.auth.getUser(token);
    if (!u?.user) return json({ error: "Unauthorized" }, 401);
    const { data: role } = await supabase
      .from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!role) return json({ error: "Forbidden" }, 403);
    isAdmin = true;
  }

  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!vapidPublic || !vapidPrivate) return json({ error: "VAPID keys missing" }, 500);
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") || "mailto:contact@covesting.com", vapidPublic, vapidPrivate);

  // ---- Payload ----
  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const { user_id, broadcast, title, body, url, tag } = payload || {};
  if (!title) return json({ error: "title required" }, 400);
  if (broadcast && !(isAdmin || trusted)) return json({ error: "Forbidden" }, 403);

  let query = supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth");
  if (!broadcast) {
    if (!user_id) return json({ error: "user_id required" }, 400);
    query = query.eq("user_id", user_id);
  }
  const { data: subs, error } = await query;
  if (error) return json({ error: error.message }, 500);
  if (!subs?.length) return json({ sent: 0, removed: 0 });

  const message = JSON.stringify({
    title: String(title).slice(0, 120),
    body: String(body || "").slice(0, 300),
    url: url || "/dashboard",
    tag: tag || undefined,
  });

  let sent = 0;
  const expired: string[] = [];

  for (let i = 0; i < subs.length; i += 50) {
    const batch = subs.slice(i, i + 50);
    await Promise.all(batch.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          message,
          { TTL: 60 * 60 * 24 },
        );
        sent++;
      } catch (e: any) {
        // 404 / 410 : abonnement expiré ou révoqué -> on le supprime
        if (e?.statusCode === 404 || e?.statusCode === 410) expired.push(s.id);
        else console.error("push error", e?.statusCode, e?.body || e?.message);
      }
    }));
  }

  if (expired.length) await supabase.from("push_subscriptions").delete().in("id", expired);
  return json({ sent, removed: expired.length });
});
