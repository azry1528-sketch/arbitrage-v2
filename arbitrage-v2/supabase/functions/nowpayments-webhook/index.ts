// NOWPayments IPN webhook — updates deposit status & credits user balance
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-nowpayments-sig",
};

// Deterministic JSON sort (NOWPayments HMAC spec)
function sortedStringify(obj: any): string {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return JSON.stringify(obj);
  const keys = Object.keys(obj).sort();
  const out: Record<string, any> = {};
  for (const k of keys) out[k] = obj[k];
  return JSON.stringify(out, (_k, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const s: Record<string, any> = {};
      for (const k of Object.keys(v).sort()) s[k] = v[k];
      return s;
    }
    return v;
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const raw = await req.text();
    const ipnSecret = Deno.env.get("NOWPAYMENTS_IPN_SECRET");
    const sig = req.headers.get("x-nowpayments-sig");

    // Verify signature if secret configured
    if (ipnSecret) {
      if (!sig) return new Response("Missing signature", { status: 401, headers: corsHeaders });
      const parsed = JSON.parse(raw);
      const expected = createHmac("sha512", ipnSecret).update(sortedStringify(parsed)).digest("hex");
      if (expected !== sig) {
        console.error("Invalid HMAC", { expected, got: sig });
        return new Response("Invalid signature", { status: 401, headers: corsHeaders });
      }
    }

    const payload = JSON.parse(raw);
    console.log("NOWPayments IPN:", payload);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const paymentId = String(payload.payment_id || "");
    const status = String(payload.payment_status || "").toLowerCase();
    const actuallyPaid = Number(payload.actually_paid || payload.price_amount || 0);

    if (!paymentId) return new Response("Missing payment_id", { status: 400, headers: corsHeaders });

    // Find matching deposit
    const { data: deposit } = await supabase
      .from("deposits")
      .select("*")
      .eq("transaction_hash", paymentId)
      .maybeSingle();

    if (!deposit) {
      console.warn("Deposit not found for payment_id", paymentId);
      return new Response("Deposit not found", { status: 404, headers: corsHeaders });
    }

    // Map NOWPayments statuses
    let newStatus = deposit.status;
    if (["finished", "confirmed", "sending"].includes(status)) newStatus = "completed";
    else if (["failed", "refunded", "expired"].includes(status)) newStatus = "rejected";
    else if (["waiting", "confirming", "partially_paid"].includes(status)) newStatus = "pending";

    // Only credit once when transitioning to completed
    if (newStatus === "completed" && deposit.status !== "completed") {
      const { data: prof } = await supabase
        .from("profiles").select("balance").eq("id", deposit.user_id).maybeSingle();
      const newBal = Number(prof?.balance || 0) + Number(deposit.amount);
      await supabase.from("profiles").update({ balance: newBal }).eq("id", deposit.user_id);
    }

    await supabase.from("deposits").update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    }).eq("id", deposit.id);

    return new Response(JSON.stringify({ ok: true, status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
