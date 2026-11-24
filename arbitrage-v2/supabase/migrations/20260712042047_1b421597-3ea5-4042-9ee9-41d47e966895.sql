
-- 1) daily_snapshots: remove permissive ALL policy, keep service-role write only
DROP POLICY IF EXISTS "System writes snapshots" ON public.daily_snapshots;
-- SELECT policy for users/admins already exists ("Users view own snapshots")
-- Writes are performed by SECURITY DEFINER function `calculate_daily_returns` (bypasses RLS)
-- and by service_role via edge functions (bypasses RLS). No user-facing INSERT/UPDATE/DELETE policy needed.

-- 2) Revoke SELECT from anon on private tables (keep authenticated per existing RLS)
REVOKE SELECT ON public.profiles          FROM anon;
REVOKE SELECT ON public.deposits          FROM anon;
REVOKE SELECT ON public.withdrawals       FROM anon;
REVOKE SELECT ON public.investments       FROM anon;
REVOKE SELECT ON public.user_roles        FROM anon;
REVOKE SELECT ON public.notifications     FROM anon;
REVOKE SELECT ON public.arbitrage_sessions FROM anon;
REVOKE SELECT ON public.arbitrage_trades  FROM anon;
REVOKE SELECT ON public.support_tickets   FROM anon;
REVOKE SELECT ON public.daily_snapshots   FROM anon;
-- investment_plans remains readable by anon (public marketing content)

-- 3) Lock down SECURITY DEFINER functions
-- Revoke EXECUTE from PUBLIC & anon on every function, then re-grant to authenticated only where needed.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role)              FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_profile_id(uuid)                  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_daily_returns(uuid)         FROM PUBLIC, anon;

-- Trigger-only / admin-only functions: revoke from anon AND authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_deposit_status()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_investment_created()            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_withdrawal_status()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.promote_to_admin(text)                 FROM PUBLIC, anon, authenticated;
