// Utilisateur -> envoie un message dans sa conversation de support.
// Le message est enregistré puis transféré aux admins liés sur Telegram.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: u, error: uErr } = await userClient.auth.getUser();
    if (uErr || !u.user) return json({ error: "Invalid user" }, 401);

    const { data: profile } = await admin.from("profiles").select("id, full_name, email").eq("user_id", u.user.id).single();
    if (!profile) return json({ error: "Profile not found" }, 404);

    const { message } = await req.json();
    const text = String(message ?? "").trim();
    if (!text) return json({ error: "Message vide" }, 400);
    if (text.length > 2000) return json({ error: "Message trop long (2000 caractères max)" }, 400);

    // Anti-spam : 20 messages / 10 minutes
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await admin.from("support_messages").select("id", { count: "exact", head: true })
      .eq("user_id", profile.id).eq("sender", "user").gte("created_at", since);
    if ((count ?? 0) >= 20) return json({ error: "Trop de messages, réessayez dans quelques minutes." }, 429);

    const { data: saved, error: insErr } = await admin.from("support_messages")
      .insert({ user_id: profile.id, sender: "user", body: text }).select().single();
    if (insErr) return json({ error: insErr.message }, 500);

    // Transfert vers Telegram (si le bot est configuré et qu'au moins un admin est lié)
    let delivered = 0;
    let telegram = "ok";
    const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!token) {
      telegram = "token_missing";
      console.error("TELEGRAM_BOT_TOKEN manquant");
    } else {
      const { data: admins, error: admErr } = await admin.from("telegram_admins").select("chat_id");
      if (admErr) { telegram = "db_error"; console.error("telegram_admins:", admErr.message); }
      else if (!admins?.length) { telegram = "no_admin_linked"; console.error("Aucun admin lie : envoyer /start <CODE> au bot"); }
      for (const a of admins ?? []) {
        const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: a.chat_id,
            parse_mode: "HTML",
            text: `💬 <b>${esc(profile.full_name || "Utilisateur")}</b> · ${esc(profile.email || "")}\n\n${esc(text)}\n\n<i>↩️ Répondez (Reply) à ce message pour répondre au client.</i>`,
          }),
        }).then((r) => r.json()).catch(() => null);
        if (tg?.ok && tg.result?.message_id) {
          delivered++;
          await admin.from("telegram_message_map").upsert({ chat_id: a.chat_id, message_id: tg.result.message_id, user_id: profile.id });
        } else {
          telegram = "send_failed";
          console.error("telegram sendMessage failed", JSON.stringify(tg));
        }
      }
    }
    if (telegram === "ok" && delivered === 0) telegram = "not_delivered";

    return json({ ok: true, message: saved, delivered, telegram });
  } catch (e) {
    console.error("support-send error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
