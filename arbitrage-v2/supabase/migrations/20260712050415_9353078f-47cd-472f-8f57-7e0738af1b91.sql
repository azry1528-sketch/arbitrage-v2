
-- 1) Auth trigger to create profile + role on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Notification triggers
DROP TRIGGER IF EXISTS trg_notify_deposit ON public.deposits;
CREATE TRIGGER trg_notify_deposit
  AFTER INSERT OR UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.notify_deposit_status();

DROP TRIGGER IF EXISTS trg_notify_withdrawal ON public.withdrawals;
CREATE TRIGGER trg_notify_withdrawal
  AFTER INSERT OR UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.notify_withdrawal_status();

DROP TRIGGER IF EXISTS trg_notify_investment ON public.investments;
CREATE TRIGGER trg_notify_investment
  AFTER INSERT ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.notify_investment_created();

-- 3) updated_at triggers
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['profiles','deposits','withdrawals','investments','support_tickets','arbitrage_sessions']) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
  END LOOP;
END $$;

-- 4) Backfill: create missing profiles + roles for existing auth users
INSERT INTO public.profiles (user_id, email, full_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name','')
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id,
  CASE WHEN u.email IN ('admin@arbitragex.com','tchapmoguy@gmail.com')
       THEN 'admin'::app_role ELSE 'user'::app_role END
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.id IS NULL;

-- Ensure tchapmoguy is admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'tchapmoguy@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
