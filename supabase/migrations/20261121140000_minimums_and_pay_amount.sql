-- Minimums : dépôt 60 $, retrait 60 $, capital de bot 120 $  (appliqués côté serveur)
-- + enregistrement du montant crypto exact à envoyer pour un dépôt.

ALTER TABLE public.deposits
  ADD COLUMN IF NOT EXISTS pay_amount   NUMERIC,
  ADD COLUMN IF NOT EXISTS pay_currency TEXT;

-- Triggers (et non CHECK) : ils ne s'appliquent qu'aux NOUVELLES lignes, sans bloquer
-- la mise à jour de statut d'anciens dépôts/retraits de 50 $.
CREATE OR REPLACE FUNCTION public.enforce_min_deposit() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.amount < 60 THEN RAISE EXCEPTION 'min_deposit_60' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_enforce_min_deposit ON public.deposits;
CREATE TRIGGER trg_enforce_min_deposit BEFORE INSERT ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.enforce_min_deposit();

CREATE OR REPLACE FUNCTION public.enforce_min_withdrawal() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.amount < 60 THEN RAISE EXCEPTION 'min_withdrawal_60' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_enforce_min_withdrawal ON public.withdrawals;
CREATE TRIGGER trg_enforce_min_withdrawal BEFORE INSERT ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.enforce_min_withdrawal();

-- Bots : capital alloué >= 120 à la création, et à chaque modification du capital
CREATE OR REPLACE FUNCTION public.enforce_min_bot_capital() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR NEW.allocated_amount IS DISTINCT FROM OLD.allocated_amount)
     AND COALESCE(NEW.allocated_amount, 0) < 120 THEN
    RAISE EXCEPTION 'min_bot_capital_120' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_enforce_min_bot_capital ON public.bots;
CREATE TRIGGER trg_enforce_min_bot_capital BEFORE INSERT OR UPDATE ON public.bots
  FOR EACH ROW EXECUTE FUNCTION public.enforce_min_bot_capital();
