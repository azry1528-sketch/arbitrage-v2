// Telegram -> plateforme. Les admins répondent en « Reply » à un message client :
// la réponse apparaît dans la discussion de support de l'utilisateur.
// Secrets : TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_ADMIN_LINK_CODE
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ok = () => new Response("ok", { status: 200 });

Deno.serve(async (req) => {
  if (req.method === "GET") {
    return new Response(JSON.stringify({
      TELEGRAM_BOT_TOKEN: !!Deno.env.get("TELEGRAM_BOT_TOKEN"),
      TELEGRAM_WEBHOOK_SECRET: !!Deno.env.get("TELEGRAM_WEBHOOK_SECRET"),
      TELEGRAM_ADMIN_LINK_CODE: !!Deno.env.get("TELEGRAM_ADMIN_LINK_CODE"),
    }), { headers: { "Content-Type": "application/json" } });
  }
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const secret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
  const linkCode = Deno.env.get("TELEGRAM_ADMIN_LINK_CODE");
  if (!token || !secret) return new Response("not configured", { status: 500 });

  // Telegram renvoie ce secret dans chaque appel (défini à setWebhook)
  if (req.headers.get("x-telegram-bot-api-secret-token") !== secret) return new Response("forbidden", { status: 401 });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const send = (chat_id: number, text: string, reply_to?: number) =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text, ...(reply_to ? { reply_parameters: { message_id: reply_to, allow_sending_without_reply: true } } : {}) }),
    }).catch(() => null);

  let update: any;
  try { update = await req.json(); } catch { return ok(); }
  const m = update?.message;
  if (!m?.text || m.chat?.type !== "private") return ok();

  const chatId: number = m.chat.id;
  const text: string = String(m.text).trim();

  // 1) Liaison d'un admin : /start CODE  ou  /link CODE
  const link = text.match(/^\/(?:start|link)(?:@\w+)?\s+(\S+)$/i);
  if (link) {
    if (!linkCode) {
      await send(chatId, "Code de liaison non configure cote serveur (TELEGRAM_ADMIN_LINK_CODE).");
    } else if (link[1] === linkCode) {
      await admin.from("telegram_admins").upsert({ chat_id: chatId, label: m.from?.username || m.from?.first_name || null });
      await send(chatId, "✅ Compte support lié. Vous recevrez ici les messages des clients.\nPour répondre : utilisez « Répondre » (Reply) sur le message du client.");
    } else {
      await send(chatId, "❌ Code invalide.");
    }
    return ok();
  }

  // 2) Seuls les chats liés sont autorisés
  const { data: isAdmin } = await admin.from("telegram_admins").select("chat_id").eq("chat_id", chatId).maybeSingle();
  if (!isAdmin) {
    await send(chatId, "Ce bot est réservé à l'équipe support Covesting.");
    return ok();
  }

  if (/^\/unlink\b/i.test(text)) {
    await admin.from("telegram_admins").delete().eq("chat_id", chatId);
    await send(chatId, "Compte délié. Vous ne recevrez plus les messages.");
    return ok();
  }

  // 3) Réponse à un message client
  const replyTo = m.reply_to_message?.message_id;
  if (!replyTo || text.startsWith("/")) {
    await send(chatId, "Pour répondre à un client, utilisez « Répondre » (Reply) sur son message.\n/unlink : ne plus recevoir les messages.");
    return ok();
  }

  const { data: map } = await admin.from("telegram_message_map").select("user_id").eq("chat_id", chatId).eq("message_id", replyTo).maybeSingle();
  if (!map) {
    await send(chatId, "⚠️ Impossible de retrouver le client de ce message. Répondez à un message client récent.", m.message_id);
    return ok();
  }

  const body = text.slice(0, 4000);
  const { error } = await admin.from("support_messages").insert({ user_id: map.user_id, sender: "admin", body });
  if (error) {
    console.error("insert support message failed", error.message);
    await send(chatId, "⚠️ Échec de l'envoi : " + error.message, m.message_id);
    return ok();
  }

  // Notification dans l'app (déclenche aussi le push si configuré)
  await admin.from("notifications").insert({
    user_id: map.user_id, type: "support_reply", title: "💬 Réponse du support", message: body.slice(0, 140),
    metadata: { source: "telegram" },
  });

  const { data: p } = await admin.from("profiles").select("full_name").eq("id", map.user_id).maybeSingle();
  await send(chatId, `✅ Envoyé à ${p?.full_name || "l'utilisateur"}`, m.message_id);
  return ok();
});
