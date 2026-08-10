-- =====================================================================
-- 1) MOTEUR D'ARBITRAGE COTE SERVEUR (pg_cron)
--    Avant : les trades étaient générés par un setInterval() côté
--    navigateur (TradingContext.tsx). Résultat : dès que l'onglet est
--    fermé / l'utilisateur quitte la page, plus rien ne se passe, et au
--    retour ou au rafraîchissement la simulation "repart de zéro".
--    Maintenant : un job pg_cron s'exécute côté base de données, donc
--    les sessions actives continuent de produire des trades même si
--    personne n'a l'app ouverte. Le frontend ne fait plus que LIRE
--    l'état (polling + realtime), il ne génère plus rien lui-même.
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- ---------------------------------------------------------------------
-- 2) SYSTEME DE CREDITS (puissance de calcul allouée)
--    Chaque utilisateur démarre avec un nombre de crédits minime.
--    Chaque trade généré par le moteur consomme des crédits (le coût
--    dépend du niveau de risque du bot = plus de calcul nécessaire).
--    Quand les crédits journaliers sont épuisés, les sessions du user
--    s'arrêtent automatiquement et il doit recharger pour continuer.
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credits NUMERIC NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS credits_reset_date DATE NOT NULL DEFAULT CURRENT_DATE;

COMMENT ON COLUMN public.profiles.credits IS 'Puissance de calcul disponible pour faire tourner les sessions d''arbitrage. Se réinitialise chaque jour.';

-- Coût en crédits par déclenchement du moteur, selon le niveau de risque du bot
CREATE OR REPLACE FUNCTION public.credit_cost_for_risk(_risk TEXT)
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(coalesce(_risk, 'moyen'))
    WHEN 'faible' THEN 1
    WHEN 'élevé' THEN 3
    WHEN 'eleve' THEN 3
    ELSE 2
  END;
$$;

-- Recharge de crédits : convertit une partie du solde en crédits de calcul
-- (1 USD = 20 crédits). Utilisé par le bouton "Recharger" côté app.
CREATE OR REPLACE FUNCTION public.recharge_credits(_amount_usd NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_profile_id UUID;
  v_balance NUMERIC;
  v_new_credits NUMERIC;
BEGIN
  SELECT id, balance INTO v_profile_id, v_balance FROM public.profiles WHERE user_id = auth.uid();
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profil introuvable';
  END IF;
  IF _amount_usd IS NULL OR _amount_usd <= 0 THEN
    RAISE EXCEPTION 'Montant invalide';
  END IF;
  IF v_balance < _amount_usd THEN
    RAISE EXCEPTION 'Solde insuffisant pour recharger';
  END IF;

  UPDATE public.profiles
    SET balance = balance - _amount_usd,
        credits = credits + (_amount_usd * 20)
    WHERE id = v_profile_id
    RETURNING credits INTO v_new_credits;

  INSERT INTO public.notifications(user_id, type, title, message, metadata)
  VALUES (v_profile_id, 'credits_recharged', '⚡ Crédits rechargés',
    'Vous avez rechargé ' || (_amount_usd * 20)::int || ' crédits pour $' || _amount_usd || '.',
    jsonb_build_object('amount_usd', _amount_usd, 'credits_added', _amount_usd * 20));

  RETURN v_new_credits;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recharge_credits(NUMERIC) TO authenticated;

-- ---------------------------------------------------------------------
-- 3) LOGS DE BOT DETAILLES (achat / vente séparés, exploitables pour
--    l'affichage en couleur : achat en vert, vente en rouge)
-- ---------------------------------------------------------------------
ALTER TABLE public.bot_logs
  ADD COLUMN IF NOT EXISTS crypto_pair TEXT,
  ADD COLUMN IF NOT EXISTS buy_exchange TEXT,
  ADD COLUMN IF NOT EXISTS sell_exchange TEXT,
  ADD COLUMN IF NOT EXISTS buy_price NUMERIC,
  ADD COLUMN IF NOT EXISTS sell_price NUMERIC,
  ADD COLUMN IF NOT EXISTS quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS spread_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS profit NUMERIC,
  ADD COLUMN IF NOT EXISTS credits_used NUMERIC;

-- ---------------------------------------------------------------------
-- 4) LE MOTEUR : public.process_arbitrage_tick()
--    Exécuté chaque minute par pg_cron. Pour chaque session active,
--    génère plusieurs micro-trades réalistes (proportionnels au
--    capital alloué du bot), crédite le solde (trigger existant
--    trg_credit_arbitrage_trade), consomme des crédits, et arrête
--    automatiquement la session si le user n'a plus de crédits.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_arbitrage_tick()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  EXCHANGES CONSTANT TEXT[] := ARRAY['Binance','Coinbase','Kraken','Huobi','KuCoin','Bybit','OKX'];
  PAIRS CONSTANT TEXT[] := ARRAY['BTC/USDT','ETH/USDT','BNB/USDT','SOL/USDT'];
  s RECORD;
  v_user_id UUID;
  v_credits NUMERIC;
  v_capital NUMERIC;
  v_risk TEXT;
  v_ticks INTEGER;
  i INTEGER;
  v_bx TEXT; v_sx TEXT; v_pair TEXT; v_base NUMERIC;
  v_bp NUMERIC; v_sp NUMERIC; v_qty NUMERIC; v_profit NUMERIC;
  v_risk_mult NUMERIC; v_pct NUMERIC; v_cost NUMERIC; v_is_loss BOOLEAN;
  v_day_gain NUMERIC; v_day_cap NUMERIC;
BEGIN
  -- Réinitialise les crédits journaliers des utilisateurs dont le compteur a expiré
  UPDATE public.profiles
    SET credits = 30, credits_reset_date = CURRENT_DATE
    WHERE credits_reset_date < CURRENT_DATE;

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

    SELECT credits INTO v_credits FROM public.profiles WHERE id = v_user_id;
    IF v_credits IS NULL OR v_credits <= 0 THEN
      UPDATE public.arbitrage_sessions SET is_active = false, end_time = now() WHERE id = s.session_id;
      IF s.bot_id IS NOT NULL THEN
        INSERT INTO public.bot_logs (bot_id, step, message)
        VALUES (s.bot_id, 'stop', '⏸️ Crédits de calcul épuisés pour aujourd''hui. Rechargez pour continuer le trading.');
      END IF;
      CONTINUE;
    END IF;

    -- plafond réaliste : max ~3.5% du capital de gain net par jour et par bot
    v_day_cap := v_capital * 0.035;
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
      SELECT credits INTO v_credits FROM public.profiles WHERE id = v_user_id;
      v_cost := public.credit_cost_for_risk(v_risk);
      IF v_credits IS NULL OR v_credits < v_cost THEN
        UPDATE public.arbitrage_sessions SET is_active = false, end_time = now() WHERE id = s.session_id;
        IF s.bot_id IS NOT NULL THEN
          INSERT INTO public.bot_logs (bot_id, step, message)
          VALUES (s.bot_id, 'stop', '⏸️ Crédits de calcul épuisés pour aujourd''hui. Rechargez pour continuer le trading.');
        END IF;
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

      v_is_loss := random() < 0.12; -- ~12% des micro-trades : léger repli, pour rester réaliste

      IF v_is_loss THEN
        v_pct := (0.0002 + random() * 0.0006) * v_risk_mult; -- -0.02% à -0.08% du capital, pondéré risque
        v_profit := - (v_capital * v_pct);
        v_bp := v_base * (1 + random() * 0.0015);
        v_sp := v_base * (1 - random() * 0.0008);
      ELSE
        v_pct := (0.0006 + random() * 0.0022) * v_risk_mult; -- 0.06% à ~0.37% du capital, pondéré risque
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
          (bot_id, step, message, crypto_pair, buy_exchange, sell_exchange, buy_price, sell_price, quantity, spread_pct, profit, credits_used)
        VALUES
          (s.bot_id, 'trade',
           format('%s : achat %s @ $%s → vente %s @ $%s (qté %s) = %s$%s',
             v_pair, v_bx, round(v_bp::numeric,2), v_sx, round(v_sp::numeric,2),
             round(v_qty::numeric,6), CASE WHEN v_profit >= 0 THEN '+' ELSE '' END, round(v_profit::numeric,4)),
           v_pair, v_bx, v_sx, v_bp, v_sp, v_qty,
           round((((v_sp - v_bp) / NULLIF(v_bp,0)) * 100)::numeric, 4), v_profit, v_cost);
      END IF;

      UPDATE public.profiles SET credits = GREATEST(credits - v_cost, 0) WHERE id = v_user_id;
    END LOOP;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_arbitrage_tick() FROM PUBLIC, anon, authenticated;

-- Planifie le moteur pour tourner chaque minute, en continu côté serveur
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'process-arbitrage-tick';
SELECT cron.schedule('process-arbitrage-tick', '* * * * *', $$SELECT public.process_arbitrage_tick();$$);

-- ---------------------------------------------------------------------
-- 5) Capital alloué obligatoire : un bot doit toujours avoir un capital > 0
-- ---------------------------------------------------------------------
UPDATE public.bots SET allocated_amount = 25 WHERE allocated_amount IS NULL OR allocated_amount <= 0;
ALTER TABLE public.bots
  ALTER COLUMN allocated_amount SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bots_allocated_amount_positive'
  ) THEN
    ALTER TABLE public.bots
      ADD CONSTRAINT bots_allocated_amount_positive CHECK (allocated_amount > 0);
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 6) Plus d'annonces pour la page d'accueil / popup de connexion
-- ---------------------------------------------------------------------
INSERT INTO public.announcements (title, message)
SELECT * FROM (VALUES
  ('⚡ Nouveau : système de crédits', 'Chaque session de trading consomme des crédits de calcul. Rechargez à tout moment depuis la page Bots pour prolonger votre journée d''arbitrage.'),
  ('🤖 Bots automatiques améliorés', 'Le déploiement d''un bot est désormais plus détaillé : analyse des paramètres, calibration de l''algorithme puis mise en production, en 3 étapes.'),
  ('🔒 Sécurité renforcée', 'Ajoutez un mot de passe de retrait dans votre profil pour sécuriser vos transactions sortantes.'),
  ('📈 Gains journaliers plafonnés pour plus de réalisme', 'Nos algorithmes limitent désormais les gains quotidiens à un pourcentage raisonnable du capital alloué, pour refléter des conditions de marché réalistes.'),
  ('👥 Programme de parrainage', 'Invitez vos proches avec votre code de parrainage et suivez vos filleuls depuis l''onglet Réseau.'),
  ('🛠️ Moteur d''arbitrage 24/7', 'Vos bots continuent de trader même lorsque vous fermez l''application, tant que vous disposez de crédits.')
) AS v(title, message)
WHERE NOT EXISTS (SELECT 1 FROM public.announcements WHERE announcements.title = v.title);
