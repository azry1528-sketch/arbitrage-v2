-- =====================================================================
-- REGLAGES PAR STRATEGIE D'ARBITRAGE (page Stratégies)
--    Remplace le stockage localStorage précédent : l'activation, le
--    pourcentage d'allocation de capital et le seuil de profit minimum
--    sont désormais liés au compte utilisateur (synchro multi-appareils).
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.user_strategy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  strategy TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  allocation_pct NUMERIC NOT NULL DEFAULT 25,
  min_profit_threshold NUMERIC NOT NULL DEFAULT 0.1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, strategy)
);

ALTER TABLE public.user_strategy_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own strategy settings" ON public.user_strategy_settings;
CREATE POLICY "Users manage own strategy settings" ON public.user_strategy_settings FOR ALL
  USING (user_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = public.get_profile_id(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_strategy_settings TO authenticated;

COMMENT ON TABLE public.user_strategy_settings IS 'Réglages utilisateur par stratégie d''arbitrage (inter, triangular, stat, mm) : activation, allocation de capital cible, seuil de profit minimum';

-- updated_at tenu à jour automatiquement à chaque modification
CREATE OR REPLACE FUNCTION public.touch_strategy_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_strategy_settings ON public.user_strategy_settings;
CREATE TRIGGER trg_touch_strategy_settings
BEFORE UPDATE ON public.user_strategy_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_strategy_settings_updated_at();
