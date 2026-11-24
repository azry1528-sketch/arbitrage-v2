-- =====================================================================
-- BONUS DE PARRAINAGE SUR DEPOT (10% du montant rechargé par le filleul)
--    Centralisé dans un trigger BDD (plutôt que dans le code de
--    l'admin ou du webhook NOWPayments) pour que le bonus soit crédité
--    de façon fiable quel que soit le chemin d'approbation du dépôt.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.referral_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  deposit_id UUID NOT NULL REFERENCES public.deposits(id) ON DELETE CASCADE,
  deposit_amount NUMERIC NOT NULL,
  bonus_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (deposit_id)
);

ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own referral earnings" ON public.referral_earnings;
CREATE POLICY "Users view own referral earnings" ON public.referral_earnings FOR SELECT
  USING (referrer_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.referral_earnings TO authenticated;
GRANT ALL ON public.referral_earnings TO service_role;

COMMENT ON TABLE public.referral_earnings IS 'Historique des bonus de parrainage (10% du montant de chaque dépôt approuvé d''un filleul)';

CREATE OR REPLACE FUNCTION public.credit_referral_bonus_on_deposit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_bonus NUMERIC;
BEGIN
  -- Ne déclenche qu'au premier passage en statut "approuvé"
  IF NEW.status IN ('approved', 'completed') AND OLD.status NOT IN ('approved', 'completed') THEN

    SELECT referred_by INTO v_referrer_id
    FROM public.profiles
    WHERE id = NEW.user_id;

    IF v_referrer_id IS NOT NULL THEN
      v_bonus := NEW.amount * 0.10;

      UPDATE public.profiles
      SET balance = balance + v_bonus,
          total_earnings = total_earnings + v_bonus
      WHERE id = v_referrer_id;

      INSERT INTO public.referral_earnings (referrer_id, referred_id, deposit_id, deposit_amount, bonus_amount)
      VALUES (v_referrer_id, NEW.user_id, NEW.id, NEW.amount, v_bonus)
      ON CONFLICT (deposit_id) DO NOTHING;

      INSERT INTO public.notifications (user_id, type, title, message, metadata)
      VALUES (
        v_referrer_id,
        'referral_bonus',
        '🎉 Bonus de parrainage',
        'Vous avez reçu $' || round(v_bonus, 2) || ' (10%) suite au dépôt de $' || NEW.amount || ' d''un de vos filleuls.',
        jsonb_build_object('deposit_id', NEW.id, 'bonus_amount', v_bonus)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_referral_bonus ON public.deposits;
CREATE TRIGGER trg_credit_referral_bonus
AFTER UPDATE ON public.deposits
FOR EACH ROW EXECUTE FUNCTION public.credit_referral_bonus_on_deposit();
