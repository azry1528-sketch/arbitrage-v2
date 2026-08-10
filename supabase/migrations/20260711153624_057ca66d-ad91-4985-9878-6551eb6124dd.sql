
ALTER TABLE public.investments 
  ADD COLUMN IF NOT EXISTS last_calculation_date TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.calculate_daily_returns(_user_id UUID)
RETURNS TABLE(investment_id UUID, days_credited INTEGER, amount_credited NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  days_elapsed INTEGER;
  credit NUMERIC;
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
        SET balance = balance + credit,
            total_earnings = total_earnings + credit
        WHERE id = inv.user_id;
      
      investment_id := inv.id;
      days_credited := days_elapsed;
      amount_credited := credit;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_daily_returns(UUID) TO authenticated;
