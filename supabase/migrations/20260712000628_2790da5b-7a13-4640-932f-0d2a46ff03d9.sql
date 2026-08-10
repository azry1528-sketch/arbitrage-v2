
-- daily_snapshots (nouveau)
CREATE TABLE IF NOT EXISTS public.daily_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  daily_gain NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, snapshot_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_snapshots TO authenticated;
GRANT ALL ON public.daily_snapshots TO service_role;
ALTER TABLE public.daily_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own snapshots" ON public.daily_snapshots;
CREATE POLICY "Users view own snapshots" ON public.daily_snapshots FOR SELECT
  USING (user_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "System writes snapshots" ON public.daily_snapshots;
CREATE POLICY "System writes snapshots" ON public.daily_snapshots FOR ALL
  USING (true) WITH CHECK (true);

-- Triggers de notifications
CREATE OR REPLACE FUNCTION public.notify_deposit_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id, type, title, message, metadata)
    VALUES (NEW.user_id, 'deposit_created', 'Dépôt en attente',
      'Votre dépôt de $' || NEW.amount || ' en ' || NEW.crypto_type || ' est en attente de confirmation.',
      jsonb_build_object('deposit_id', NEW.id, 'amount', NEW.amount));
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    IF NEW.status IN ('approved','completed') THEN
      INSERT INTO public.notifications(user_id, type, title, message, metadata)
      VALUES (NEW.user_id, 'deposit_received', '✅ Dépôt reçu',
        'Votre dépôt de $' || NEW.amount || ' a été confirmé et crédité sur votre solde.',
        jsonb_build_object('deposit_id', NEW.id, 'amount', NEW.amount));
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications(user_id, type, title, message, metadata)
      VALUES (NEW.user_id, 'deposit_rejected', '❌ Dépôt rejeté',
        'Votre dépôt de $' || NEW.amount || ' a été rejeté.',
        jsonb_build_object('deposit_id', NEW.id));
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_deposit ON public.deposits;
CREATE TRIGGER trg_notify_deposit AFTER INSERT OR UPDATE ON public.deposits
FOR EACH ROW EXECUTE FUNCTION public.notify_deposit_status();

CREATE OR REPLACE FUNCTION public.notify_investment_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(user_id, type, title, message, metadata)
  VALUES (NEW.user_id, 'investment_started', '🚀 Investissement démarré',
    'Investissement de $' || NEW.amount || ' actif. Gain quotidien : $' || NEW.daily_return || '.',
    jsonb_build_object('investment_id', NEW.id, 'amount', NEW.amount));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_investment ON public.investments;
CREATE TRIGGER trg_notify_investment AFTER INSERT ON public.investments
FOR EACH ROW EXECUTE FUNCTION public.notify_investment_created();

CREATE OR REPLACE FUNCTION public.notify_withdrawal_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id, type, title, message, metadata)
    VALUES (NEW.user_id, 'withdrawal_pending', '⏳ Retrait en attente',
      'Votre demande de retrait de $' || NEW.amount || ' est en cours de traitement.',
      jsonb_build_object('withdrawal_id', NEW.id, 'amount', NEW.amount));
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    IF NEW.status IN ('approved','completed') THEN
      INSERT INTO public.notifications(user_id, type, title, message, metadata)
      VALUES (NEW.user_id, 'withdrawal_sent', '💸 Retrait envoyé',
        'Votre retrait de $' || NEW.amount || ' en ' || NEW.crypto_type || ' a été envoyé.',
        jsonb_build_object('withdrawal_id', NEW.id));
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications(user_id, type, title, message, metadata)
      VALUES (NEW.user_id, 'withdrawal_rejected', '❌ Retrait rejeté',
        'Votre retrait de $' || NEW.amount || ' a été rejeté. Fonds recrédités.',
        jsonb_build_object('withdrawal_id', NEW.id));
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_withdrawal ON public.withdrawals;
CREATE TRIGGER trg_notify_withdrawal AFTER INSERT OR UPDATE ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.notify_withdrawal_status();

-- calculate_daily_returns : crédit auto + notif + snapshot
CREATE OR REPLACE FUNCTION public.calculate_daily_returns(_user_id uuid)
RETURNS TABLE(investment_id uuid, days_credited integer, amount_credited numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv RECORD; days_elapsed INTEGER; credit NUMERIC;
  total_today NUMERIC := 0; prof RECORD;
BEGIN
  FOR inv IN 
    SELECT i.*, p.daily_return_rate
    FROM public.investments i
    JOIN public.investment_plans p ON p.id = i.plan_id
    WHERE i.user_id = _user_id AND i.is_active = true AND i.end_date > now()
  LOOP
    days_elapsed := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - inv.last_calculation_date)) / 86400)::INTEGER);
    IF days_elapsed > 0 THEN
      credit := inv.amount * (GREATEST(inv.daily_return_rate, 5.0) / 100.0) * days_elapsed;
      UPDATE public.investments 
        SET total_earned = total_earned + credit,
            last_calculation_date = last_calculation_date + (days_elapsed * INTERVAL '1 day')
        WHERE id = inv.id;
      UPDATE public.profiles
        SET balance = balance + credit, total_earnings = total_earnings + credit
        WHERE id = inv.user_id;
      total_today := total_today + credit;
      investment_id := inv.id; days_credited := days_elapsed; amount_credited := credit;
      RETURN NEXT;
    END IF;
  END LOOP;

  IF total_today > 0 THEN
    SELECT balance, total_earnings INTO prof FROM public.profiles WHERE id = _user_id;
    INSERT INTO public.notifications(user_id, type, title, message, metadata)
    VALUES (_user_id, 'gains_credited', '💰 Gains crédités',
      '+$' || ROUND(total_today::numeric, 2) || ' de gains ont été crédités sur votre solde.',
      jsonb_build_object('amount', total_today));
    INSERT INTO public.daily_snapshots(user_id, snapshot_date, balance, total_earnings, daily_gain)
    VALUES (_user_id, CURRENT_DATE, prof.balance, prof.total_earnings, total_today)
    ON CONFLICT (user_id, snapshot_date) DO UPDATE SET
      balance = EXCLUDED.balance,
      total_earnings = EXCLUDED.total_earnings,
      daily_gain = public.daily_snapshots.daily_gain + EXCLUDED.daily_gain;
  END IF;
END; $$;
