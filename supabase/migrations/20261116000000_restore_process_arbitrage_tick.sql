-- =====================================================================
-- Restauration du moteur d'arbitrage côté serveur.
--    La fonction process_arbitrage_tick() avait été neutralisée
--    (corps remplacé par un simple RETURN;) lors du déploiement de
--    l'edge function market-scan. Le job cron continuait de l'appeler
--    chaque minute, mais aucun trade n'était inséré -> le solde ne
--    bougeait plus.
--
--    Cette version :
--      - génère 6 à 12 micro-trades par minute et par session active
--      - répartit le gain cible sur 24 h (5 %/jour par bot)
--      - ne trade que si le bot est "en retard" sur l'objectif
--        (évite les rafales en début de journée)
--      - respecte strictement le plafond journalier
--      - conserve 18 % de trades perdants pour le réalisme
-- =====================================================================

CREATE OR REPLACE FUNCTION public.process_arbitrage_tick()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  EXCHANGES CONSTANT TEXT[] := ARRAY['Binance','Coinbase','Kraken','Huobi','KuCoin','Bybit','OKX'];
  PAIRS CONSTANT TEXT[] := ARRAY['BTC/USDT','ETH/USDT','BNB/USDT','SOL/USDT'];
  DAILY_GAIN_PCT CONSTANT NUMERIC := 0.05;      -- 5 %/jour réparti sur 24 h
  MINUTES_PER_DAY CONSTANT NUMERIC := 1440;
  TRADES_PER_TICK_MIN CONSTANT INTEGER := 6;     -- beaucoup de trades…
  TRADES_PER_TICK_MAX CONSTANT INTEGER := 12;    -- …mais chacun tout petit
  s RECORD;
  v_user_id UUID;
  v_capital NUMERIC;
  v_risk TEXT;
  i INTEGER;
  v_bx TEXT; v_sx TEXT; v_pair TEXT; v_base NUMERIC;
  v_bp NUMERIC; v_sp NUMERIC; v_qty NUMERIC; v_profit NUMERIC;
  v_risk_mult NUMERIC; v_is_loss BOOLEAN;
  v_day_gain NUMERIC; v_day_cap NUMERIC;
  v_target_gain NUMERIC;
  v_remaining NUMERIC;
  v_minutes_elapsed NUMERIC;
  v_trades_this_tick INTEGER;
  v_per_trade NUMERIC;
BEGIN
  v_minutes_elapsed := EXTRACT(EPOCH FROM (now() - date_trunc('day', now()))) / 60.0;

  FOR s IN
    SELECT sess.id AS session_id, sess.user_id, sess.bot_id,
           b.allocated_amount, b.risk_level, b.status AS bot_status
    FROM public.arbitrage_sessions sess
    LEFT JOIN public.bots b ON b.id = sess.bot_id
    WHERE sess.is_active = true
  LOOP
    v_user_id := s.user_id;
    v_capital := GREATEST(COALESCE(s.allocated_amount, 25), 1);
    v_risk := COALESCE(s.risk_level, 'moyen');

    v_day_cap := v_capital * DAILY_GAIN_PCT;

    SELECT COALESCE(SUM(profit), 0) INTO v_day_gain
      FROM public.arbitrage_trades t
      JOIN public.arbitrage_sessions se ON se.id = t.session_id
      WHERE se.bot_id IS NOT DISTINCT FROM s.bot_id AND se.user_id = v_user_id
        AND t.executed_at::date = CURRENT_DATE;

    IF v_day_gain >= v_day_cap THEN
      CONTINUE;
    END IF;

    v_target_gain := v_day_cap * (v_minutes_elapsed / MINUTES_PER_DAY);
    v_remaining := GREATEST(v_target_gain - v_day_gain, 0);

    IF v_remaining <= 0 THEN
      CONTINUE;
    END IF;

    v_trades_this_tick := TRADES_PER_TICK_MIN + floor(random() * (TRADES_PER_TICK_MAX - TRADES_PER_TICK_MIN + 1))::int;

    v_per_trade := (v_remaining / 60.0) / v_trades_this_tick;
    v_per_trade := GREATEST(v_per_trade, v_capital * 0.000001);

    v_risk_mult := CASE lower(v_risk) WHEN 'faible' THEN 0.6 WHEN 'élevé' THEN 1.7 WHEN 'eleve' THEN 1.7 ELSE 1.0 END;

    FOR i IN 1..v_trades_this_tick LOOP
      SELECT COALESCE(SUM(profit), 0) INTO v_day_gain
        FROM public.arbitrage_trades t
        JOIN public.arbitrage_sessions se ON se.id = t.session_id
        WHERE se.bot_id IS NOT DISTINCT FROM s.bot_id AND se.user_id = v_user_id
          AND t.executed_at::date = CURRENT_DATE;

      IF v_day_gain >= v_day_cap THEN
        EXIT;
      END IF;

      v_bx := EXCHANGES[1 + floor(random()*7)::int];
      v_sx := EXCHANGES[1 + floor(random()*7)::int];
      WHILE v_sx = v_bx LOOP
        v_sx := EXCHANGES[1 + floor(random()*7)::int];
      END LOOP;
      v_pair := PAIRS[1 + floor(random()*4)::int];
      v_base := CASE WHEN v_pair LIKE 'BTC%' THEN 97000 WHEN v_pair LIKE 'ETH%' THEN 3200
                      WHEN v_pair LIKE 'BNB%' THEN 620 ELSE 180 END;

      v_is_loss := random() < 0.18;

      IF v_is_loss THEN
        v_profit := - (v_per_trade * (0.3 + random() * 0.8));
        v_bp := v_base * (1 + random() * 0.0008);
        v_sp := v_base * (1 - random() * 0.0004);
      ELSE
        v_profit := v_per_trade * (0.4 + random() * 1.4) * v_risk_mult;
        v_bp := v_base * (1 - random() * 0.0006);
        v_sp := v_base * (1 + random() * 0.0012);
      END IF;

      IF v_day_gain + v_profit > v_day_cap THEN
        v_profit := GREATEST(v_day_cap - v_day_gain, 0);
        IF v_profit = 0 THEN
          EXIT;
        END IF;
      END IF;

      v_qty := GREATEST(v_capital / v_base, 0.0001);

      INSERT INTO public.arbitrage_trades
        (session_id, buy_exchange, sell_exchange, crypto_pair, buy_price, sell_price, quantity, profit, executed_at)
      VALUES
        (s.session_id, v_bx, v_sx, v_pair, v_bp, v_sp, v_qty, v_profit,
         now() - (random() * 50 || ' seconds')::interval);

      IF s.bot_id IS NOT NULL THEN
        INSERT INTO public.bot_logs
          (bot_id, step, message, crypto_pair, buy_exchange, sell_exchange, buy_price, sell_price, quantity, spread_pct, profit)
        VALUES
          (s.bot_id, 'trade',
           format('%s : achat %s @ $%s → vente %s @ $%s (qté %s) = %s$%s',
             v_pair, v_bx, round(v_bp::numeric,2), v_sx, round(v_sp::numeric,2),
             round(v_qty::numeric,6), CASE WHEN v_profit >= 0 THEN '+' ELSE '' END, round(v_profit::numeric,4)),
           v_pair, v_bx, v_sx, v_bp, v_sp, v_qty,
           round((((v_sp - v_bp) / NULLIF(v_bp,0)) * 100)::numeric, 4), v_profit);
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_arbitrage_tick() FROM PUBLIC, anon, authenticated;

-- S'assurer que le job cron pointe bien sur cette fonction
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname IN ('process-arbitrage-tick', 'market-scan');
SELECT cron.schedule('process-arbitrage-tick', '* * * * *', $$SELECT public.process_arbitrage_tick();$$);
