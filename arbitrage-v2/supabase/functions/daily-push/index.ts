// Notification push quotidienne : infos de la plateforme pour inciter à revenir.
// Appelée chaque jour par pg_cron (voir migration 20261116120000_daily_push.sql),
// avec le header x-push-secret. Elle compose un message du jour puis le diffuse
// (broadcast) via la fonction send-push aux appareils abonnés.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

type Msg = { title: string; body: string; url: string; tag: string };

async function topMover(): Promise<{ symbol: string; change: number } | null> {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&price_change_percentage=24h",
    );
    if (!r.ok) return null;
    const list = await r.json();
    const best = [...list].sort(
      (a: any, b: any) => (b.price_change_percentage_24h ?? -999) - (a.price_change_percentage_24h ?? -999),
    )[0];
    if (!best) return null;
    return { symbol: String(best.symbol).toUpperCase(), change: Number(best.price_change_percentage_24h) };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const secret = Deno.env.get("PUSH_WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-push-secret") !== secret) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const candidates: Msg[] = [];

  const mover = await topMover();
  if (mover) {
    const sign = mover.change >= 0 ? "+" : "";
    candidates.push({
      title: "📈 Marchés du jour",
      body: `${mover.symbol} mène le top 50 avec ${sign}${mover.change.toFixed(2)}% sur 24h. Découvrez les marchés sur Covesting.`,
      url: "/dashboard/strategy?tab=marches",
      tag: "daily-markets",
    });
  }

  const { data: ann } = await supabase
    .from("announcements").select("title").eq("is_active", true)
    .order("created_at", { ascending: false }).limit(1);
  if (ann?.[0]?.title) {
    candidates.push({
      title: "📣 Nouveauté sur Covesting",
      body: String(ann[0].title).slice(0, 140),
      url: "/dashboard/announcements",
      tag: "daily-announcement",
    });
  }

  candidates.push(
    {
      title: "🤖 Vos bots vous attendent",
      body: "Consultez vos bots et les signaux du jour pour ne rien manquer.",
      url: "/dashboard/trade",
      tag: "daily-bots",
    },
    {
      title: "👥 Parrainage",
      body: "Invitez vos amis et suivez votre réseau depuis Covesting.",
      url: "/dashboard/network",
      tag: "daily-network",
    },
  );

  // Rotation : un message différent chaque jour.
  const day = Math.floor(Date.now() / 86_400_000);
  const msg = candidates[day % candidates.length];

  const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-push-secret": secret },
    body: JSON.stringify({ broadcast: true, ...msg }),
  });
  return json({ message: msg.tag, status: res.status, result: await res.json().catch(() => null) });
});
