import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const nowPaymentsKey = Deno.env.get("NOWPAYMENTS_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { amount, currency = "usdttrc20" } = body;

    if (!amount || amount < 50) {
      return new Response(JSON.stringify({ error: "Montant invalide (min 50$)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("user_id", userData.user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If NOWPAYMENTS_API_KEY not configured, create a pending deposit record
    // with a mock address for testing
    if (!nowPaymentsKey) {
      const { data: deposit } = await adminSupabase
        .from("deposits")
        .insert({
          user_id: profile.id,
          amount: amount,
          crypto_type: currency.toUpperCase(),
          wallet_address: "TXYZabc123DemoNoAPIKeyConfigured456",
          status: "pending",
        })
        .select()
        .single();

      return new Response(
        JSON.stringify({
          payment_id: deposit?.id,
          pay_address: "TXYZabc123DemoNoAPIKeyConfigured456",
          pay_amount: amount,
          pay_currency: currency,
          demo: true,
          message: "Mode démo - NowPayments API key non configurée",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call NowPayments API
    const npResponse = await fetch("https://api.nowpayments.io/v1/payment", {
      method: "POST",
      headers: {
        "x-api-key": nowPaymentsKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: "usd",
        pay_currency: currency,
        order_id: `dep_${profile.id}_${Date.now()}`,
        order_description: `Dépôt ArbiFlow pour utilisateur ${profile.id}`,
      }),
    });

    if (!npResponse.ok) {
      const errorText = await npResponse.text();
      console.error("NowPayments error:", errorText);
      return new Response(JSON.stringify({ error: "Erreur NowPayments", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const npData = await npResponse.json();

    // Create deposit record
    const { data: deposit } = await adminSupabase
      .from("deposits")
      .insert({
        user_id: profile.id,
        amount: amount,
        crypto_type: currency.toUpperCase(),
        wallet_address: npData.pay_address,
        transaction_hash: npData.payment_id?.toString(),
        status: "pending",
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        payment_id: npData.payment_id,
        pay_address: npData.pay_address,
        pay_amount: npData.pay_amount,
        pay_currency: npData.pay_currency,
        deposit_id: deposit?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
