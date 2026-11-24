-- ============================================================
-- 1) BOTS: table + rattachement aux sessions d'arbitrage existantes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pair TEXT NOT NULL DEFAULT 'Multi-paires',
  risk_level TEXT NOT NULL DEFAULT 'moyen',
  allocated_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active | paused
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own bots" ON public.bots;
CREATE POLICY "Users manage own bots" ON public.bots FOR ALL
  USING (user_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = public.get_profile_id(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bots TO authenticated;

-- Étape par étape / activité détaillée d'un bot
CREATE TABLE IF NOT EXISTS public.bot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own bot logs" ON public.bot_logs;
CREATE POLICY "Users view own bot logs" ON public.bot_logs FOR SELECT
  USING (bot_id IN (SELECT id FROM public.bots WHERE user_id = public.get_profile_id(auth.uid()))
         OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users insert own bot logs" ON public.bot_logs;
CREATE POLICY "Users insert own bot logs" ON public.bot_logs FOR INSERT
  WITH CHECK (bot_id IN (SELECT id FROM public.bots WHERE user_id = public.get_profile_id(auth.uid())));

GRANT SELECT, INSERT ON public.bot_logs TO authenticated;

-- Une session d'arbitrage peut désormais être rattachée à un bot (mode automatique)
ALTER TABLE public.arbitrage_sessions
  ADD COLUMN IF NOT EXISTS bot_id UUID REFERENCES public.bots(id) ON DELETE CASCADE;

-- ============================================================
-- 2) FIX "G et P d'aujourd'hui" : les gains d'arbitrage (session manuelle
--    ET bots automatiques) ne mettaient jamais à jour daily_snapshots,
--    qui est la seule source lue par le widget du tableau de bord.
--    On centralise le crédit + le snapshot dans un trigger côté base,
--    ce qui règle aussi la course entre l'insert du trade et l'update du profil.
-- ============================================================
CREATE OR REPLACE FUNCTION public.credit_arbitrage_trade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_balance NUMERIC;
  v_total_earnings NUMERIC;
BEGIN
  SELECT user_id INTO v_user_id FROM public.arbitrage_sessions WHERE id = NEW.session_id;
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.arbitrage_sessions
    SET total_profit = COALESCE(total_profit, 0) + NEW.profit,
        total_trades = COALESCE(total_trades, 0) + 1
    WHERE id = NEW.session_id;

  IF NEW.profit > 0 THEN
    UPDATE public.profiles
      SET balance = balance + NEW.profit,
          total_earnings = total_earnings + NEW.profit
      WHERE id = v_user_id
      RETURNING balance, total_earnings INTO v_balance, v_total_earnings;

    INSERT INTO public.daily_snapshots(user_id, snapshot_date, balance, total_earnings, daily_gain)
    VALUES (v_user_id, CURRENT_DATE, v_balance, v_total_earnings, NEW.profit)
    ON CONFLICT (user_id, snapshot_date) DO UPDATE SET
      balance = EXCLUDED.balance,
      total_earnings = EXCLUDED.total_earnings,
      daily_gain = public.daily_snapshots.daily_gain + EXCLUDED.daily_gain;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_arbitrage_trade ON public.arbitrage_trades;
CREATE TRIGGER trg_credit_arbitrage_trade
AFTER INSERT ON public.arbitrage_trades
FOR EACH ROW EXECUTE FUNCTION public.credit_arbitrage_trade();

REVOKE EXECUTE ON FUNCTION public.credit_arbitrage_trade() FROM PUBLIC, anon, authenticated;
