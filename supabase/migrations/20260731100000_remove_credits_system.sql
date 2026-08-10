-- ---------------------------------------------------------------------
-- Suppression du système de crédits de calcul.
--
-- Contexte : le système précédent allouait 30 crédits/jour, consommés
-- 1 à 3 par trade, avec 2 à 4 trades générés CHAQUE MINUTE par bot actif.
-- Un bot en risque "moyen" consommait donc ~6 crédits/minute, épuisant
-- les 30 crédits gratuits en environ 5 minutes -> le bot s'arrêtait
-- automatiquement bien avant d'avoir réellement manqué de fonds.
--
-- Décision produit : suppression totale de la notion de "crédits de
-- calcul". Le seul frein au trading reste le solde réel du compte.
-- Le plafond de gain journalier est recalibré à ~14.29% du capital
-- alloué par bot et par jour, de sorte qu'un bot qui tourne en continu
-- et atteint son plafond chaque jour double le capital alloué au bout
-- d'environ 7 jours d'activité (100% / 7 ≈ 14.29%/jour, en base
-- linéaire puisque le capital alloué du bot ne se réinvestit pas
-- automatiquement à chaque jour).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.process_arbitrage_tick()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  EXCHANGES CONSTANT TEXT[] := ARRAY['Binance','Coinbase','Kraken','Huobi','KuCoin','Bybit','OKX'];
  PAIRS CONSTANT TEXT[] := ARRAY['BTC/USDT','ETH/USDT','BNB/USDT','SOL/USDT'];
  DAILY_GAIN_PCT CONSTANT NUMERIC := 0.142857; -- ≈ 100%/7 : double le capital alloué en ~7 jours d'activité continue
  s RECORD;
  v_user_id UUID;
  v_capital NUMERIC;
  v_risk TEXT;
  v_ticks INTEGER;
  i INTEGER;
  v_bx TEXT; v_sx TEXT; v_pair TEXT; v_base NUMERIC;
  v_bp NUMERIC; v_sp NUMERIC; v_qty NUMERIC; v_profit NUMERIC;
  v_risk_mult NUMERIC; v_pct NUMERIC; v_is_loss BOOLEAN;
  v_day_gain NUMERIC; v_day_cap NUMERIC;
BEGIN
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

    -- Plafond de gain net par jour et par bot, calibré pour doubler le
    -- capital alloué en ~7 jours d'activité continue.
    v_day_cap := v_capital * DAILY_GAIN_PCT;
    SELECT COALESCE(SUM(profit), 0) INTO v_day_gain
      FROM public.arbitrage_trades t
      JOIN public.arbitrage_sessions se ON se.id = t.session_id
      WHERE se.bot_id IS NOT DISTINCT FROM s.bot_id AND se.user_id = v_user_id
        AND t.executed_at::date = CURRENT_DATE;
    IF v_day_gain >= v_day_cap THEN
      CONTINUE;
    END IF;

    v_risk_mult := CASE lower(v_risk) WHEN 'faible' THEN 0.6 WHEN 'élevé' THEN 1.7 WHEN 'eleve' THEN 1.7 ELSE 1.0 END;
    v_ticks := 2 + floor(random() * 3)::int; -- 2 à 4 micro-trades par minute

    FOR i IN 1..v_ticks LOOP
      v_bx := EXCHANGES[1 + floor(random()*7)::int];
      v_sx := EXCHANGES[1 + floor(random()*7)::int];
      WHILE v_sx = v_bx LOOP
        v_sx := EXCHANGES[1 + floor(random()*7)::int];
      END LOOP;
      v_pair := PAIRS[1 + floor(random()*4)::int];
      v_base := CASE WHEN v_pair LIKE 'BTC%' THEN 97000 WHEN v_pair LIKE 'ETH%' THEN 3200
                      WHEN v_pair LIKE 'BNB%' THEN 620 ELSE 180 END;

      v_is_loss := random() < 0.12; -- ~12% des micro-trades : léger repli, pour rester réaliste

      IF v_is_loss THEN
        v_pct := (0.0002 + random() * 0.0006) * v_risk_mult;
        v_profit := - (v_capital * v_pct);
        v_bp := v_base * (1 + random() * 0.0015);
        v_sp := v_base * (1 - random() * 0.0008);
      ELSE
        v_pct := (0.0006 + random() * 0.0022) * v_risk_mult;
        v_profit := v_capital * v_pct;
        v_bp := v_base * (1 - random() * 0.001);
        v_sp := v_base * (1 + random() * 0.0022);
      END IF;

      v_qty := GREATEST(v_capital / v_base, 0.0001);

      INSERT INTO public.arbitrage_trades
        (session_id, buy_exchange, sell_exchange, crypto_pair, buy_price, sell_price, quantity, profit, executed_at)
      VALUES
        (s.session_id, v_bx, v_sx, v_pair, v_bp, v_sp, v_qty, v_profit,
         now() - (floor(random()*45) || ' seconds')::interval);

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

-- La colonne credits / credits_reset_date sur profiles est conservée
-- (pas de DROP COLUMN) pour éviter toute rupture avec des vues ou
-- exports existants, mais n'est plus lue ni écrite par le moteur.
