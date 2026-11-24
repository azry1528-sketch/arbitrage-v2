// Traduit des textes d'interface (FR -> langue cible) avec cache global.
// Moteur : DeepL API (clé gratuite "...:fx" ou Pro, détectée automatiquement).
// Secret : DEEPL_API_KEY (obligatoire)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Codes cibles DeepL (EN et PT exigent une variante)
const LANGS: Record<string, string> = { en: "EN-US", es: "ES", de: "DE", it: "IT", pt: "PT-PT" };
const MAX_TEXTS = 60, MAX_LEN = 600, CHUNK_CHARS = 3000, MAX_PER_REQUEST = 50;

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// --- Protection des termes à ne pas traduire (marques, e-mails, URLs) ---
const PROTECT = /(https?:\/\/[^\s<>"]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+|\b(?:Covesting|COVS|NOWPayments|Telegram|Binance|KYC|TRC20|ERC20|BEP20)\b)/g;
const escapeXml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unescapeXml = (t: string) =>
  t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const protect = (t: string) => escapeXml(t).replace(PROTECT, "<x>$1</x>");
const unprotect = (t: string) => unescapeXml(t.replace(/<\/?x>/g, ""));

let quotaExceeded = false;

async function deeplTranslate(items: string[], target: string, apiKey: string): Promise<string[] | null> {
  const host = apiKey.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
  const res = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: items.map(protect),
      target_lang: target, // source détectée automatiquement (FR en général)
      tag_handling: "xml",
      ignore_tags: ["x"],
      preserve_formatting: true,
    }),
  });
  if (!res.ok) {
    if (res.status === 456) quotaExceeded = true; // quota mensuel épuisé
    console.error("deepl error", res.status, await res.text());
    return null;
  }
  const data = await res.json();
  const out = (data.translations ?? []).map((t: any) => (typeof t?.text === "string" ? unprotect(t.text) : null));
  return out.length === items.length && out.every((x: string | null) => x !== null) ? (out as string[]) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { lang, texts } = await req.json();
    if (!LANGS[lang]) return json({ error: "Langue non supportée" }, 400);
    if (!Array.isArray(texts) || texts.length === 0 || texts.length > MAX_TEXTS) return json({ error: "texts invalide" }, 400);
    const clean: string[] = [...new Set<string>(texts.filter((t: unknown) => typeof t === "string" && t.trim() && (t as string).length <= MAX_LEN))];

    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const hashes = await Promise.all(clean.map(sha256));
    const { data: cached } = await admin.from("translations_cache").select("src_hash, tr").eq("lang", lang).in("src_hash", hashes);
    const byHash = new Map<string, string>((cached ?? []).map((r: any) => [r.src_hash, r.tr]));

    const translations: Record<string, string> = {};
    const missing: { src: string; hash: string }[] = [];
    clean.forEach((src, i) => (byHash.has(hashes[i]) ? (translations[src] = byHash.get(hashes[i])!) : missing.push({ src, hash: hashes[i] })));

    if (missing.length) {
      const apiKey = Deno.env.get("DEEPL_API_KEY");
      if (!apiKey) return json({ translations, error: "DEEPL_API_KEY manquante" });

      // Limite d'appels (appels à DeepL uniquement) : 30/h anonyme, 200/h connecté
      let authed = false;
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const uc = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
        const { data } = await uc.auth.getUser();
        authed = !!data?.user;
      }
      const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
      const bucket = `${ip}|${new Date().toISOString().slice(0, 13)}`;
      const { data: usage } = await admin.from("translate_usage").select("calls").eq("bucket", bucket).maybeSingle();
      const calls = usage?.calls ?? 0;
      if (calls >= (authed ? 200 : 30)) return json({ translations, error: "rate_limited" }, 429);
      await admin.from("translate_usage").upsert({ bucket, calls: calls + 1 });

      // Découpage par volume de caractères
      const chunks: { src: string; hash: string }[][] = [];
      let cur: { src: string; hash: string }[] = [], size = 0;
      for (const it of missing) {
        if (cur.length && (size + it.src.length > CHUNK_CHARS || cur.length >= MAX_PER_REQUEST)) { chunks.push(cur); cur = []; size = 0; }
        cur.push(it); size += it.src.length;
      }
      if (cur.length) chunks.push(cur);

      const rows: any[] = [];
      await Promise.all(chunks.map(async (chunk) => {
        const out = await deeplTranslate(chunk.map((c) => c.src), LANGS[lang], apiKey);
        if (!out) return;
        chunk.forEach((c, i) => {
          translations[c.src] = out[i];
          rows.push({ lang, src_hash: c.hash, src: c.src, tr: out[i] });
        });
      }));
      if (rows.length) await admin.from("translations_cache").upsert(rows, { onConflict: "lang,src_hash" });
    }

    return json(quotaExceeded ? { translations, error: "quota_exceeded" } : { translations });
  } catch (e) {
    console.error("translate-texts error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
