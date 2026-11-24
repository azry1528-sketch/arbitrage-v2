-- =====================================================================
-- Débit du solde au passage d'un retrait en "approuvé" (côté base).
--   - Débit unique : seulement au premier passage pending/rejected -> approved/completed
--     (approved -> completed ne débite pas une 2e fois).
--   - Refus si le solde est insuffisant (l'approbation échoue, rien n'est modifié).
--   - Si un retrait déjà approuvé repasse en pending/rejected, le montant est recrédité.
--   - Atomique : statut et solde changent dans la même transaction.
-- Le front ne doit plus modifier le solde lui-même lors de l'approbation.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.debit_balance_on_withdrawal_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_was_paid BOOLEAN := OLD.status IN ('approved', 'completed');
  v_is_paid  BOOLEAN := NEW.status IN ('approved', 'completed');
  v_balance  NUMERIC;
BEGIN
  IF NOT v_was_paid AND v_is_paid THEN
    SELECT balance INTO v_balance
    FROM public.profiles
    WHERE id = NEW.user_id
    FOR UPDATE;

    IF v_balance IS NULL THEN
      RAISE EXCEPTION 'profil_introuvable';
    END IF;
    IF v_balance < NEW.amount THEN
      RAISE EXCEPTION 'solde_insuffisant' USING ERRCODE = '23514';
    END IF;

    UPDATE public.profiles
      SET balance = balance - NEW.amount
      WHERE id = NEW.user_id;

  ELSIF v_was_paid AND NOT v_is_paid THEN
    UPDATE public.profiles
      SET balance = balance + OLD.amount
      WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.debit_balance_on_withdrawal_approval() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_debit_balance_on_withdrawal ON public.withdrawals;
CREATE TRIGGER trg_debit_balance_on_withdrawal
BEFORE UPDATE OF status ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.debit_balance_on_withdrawal_approval();
