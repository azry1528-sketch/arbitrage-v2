-- =====================================================================
-- Purge des trades d'arbitrage anciens.
--    La table arbitrage_trades grossit vite (~10-15k lignes/jour/bot).
--    On supprime les lignes de plus de N jours, mais on conserve les
--    agrégats : arbitrage_sessions.total_profit et total_trades sont
--    mis à jour par le trigger credit_arbitrage_trade() à chaque trade,
--    donc l'historique cumulé reste intact côté sessions.
--    Les bot_logs sont purgés avec la même rétention.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.purge_old_arbitrage_trades(_retention_days INTEGER DEFAULT 30)
RETURNS TABLE(trades_deleted BIGINT, logs_deleted BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ;
  v_trades BIGINT := 0;
  v_logs BIGINT := 0;
BEGIN
  IF _retention_days IS NULL OR _retention_days < 1 THEN
    RAISE EXCEPTION 'retention_days doit être >= 1';
  END IF;

  v_cutoff := now() - (_retention_days || ' days')::interval;

  DELETE FROM public.arbitrage_trades WHERE executed_at < v_cutoff;
  GET DIAGNOSTICS v_trades = ROW_COUNT;

  DELETE FROM public.bot_logs WHERE created_at < v_cutoff;
  GET DIAGNOSTICS v_logs = ROW_COUNT;

  trades_deleted := v_trades;
  logs_deleted := v_logs;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_old_arbitrage_trades(INTEGER) FROM PUBLIC, anon, authenticated;

-- Purge quotidienne à 03:15 UTC, rétention 30 jours
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'purge-arbitrage-trades';
SELECT cron.schedule(
  'purge-arbitrage-trades',
  '15 3 * * *',
  $$SELECT public.purge_old_arbitrage_trades(30);$$
);
