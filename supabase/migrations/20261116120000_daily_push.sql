-- =====================================================================
-- Push quotidien : chaque jour à 17:00 UTC (18h Paris en hiver), appelle
-- l'Edge Function daily-push qui diffuse un message d'infos plateforme
-- aux appareils abonnés (réglage Paramètres > Notifications push).
-- Prérequis : migration web_push appliquée + ligne dans public.push_settings.
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.send_daily_push()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  s RECORD;
BEGIN
  SELECT function_url, webhook_secret INTO s FROM public.push_settings WHERE id = 1;
  IF s.function_url IS NULL THEN RETURN; END IF;

  PERFORM net.http_post(
    url     := replace(s.function_url, '/send-push', '/daily-push'),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', s.webhook_secret),
    body    := '{}'::jsonb
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_daily_push() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('daily-platform-push')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-platform-push');

SELECT cron.schedule('daily-platform-push', '0 17 * * *', $$SELECT public.send_daily_push();$$);
