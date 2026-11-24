-- ============================================================
-- FIX : un bot pouvait se retrouver avec PLUSIEURS sessions
-- d'arbitrage actives (is_active = true) en même temps. Quand
-- l'utilisateur cliquait sur "Arrêter", seule une session était
-- stoppée côté client : l'autre continuait d'être traitée par
-- process_arbitrage_tick() (pg_cron), donnant l'impression que le
-- bot "redémarrait tout seul" quelques secondes après l'arrêt.
--
-- 1) Nettoyage : pour chaque bot, on ne garde active que la session
--    la plus récente et on désactive les doublons existants.
-- 2) Garde-fou : un index unique partiel empêche désormais qu'un
--    même bot ait plus d'une session active à la fois, quelle que
--    soit l'origine de la requête (UI, retry réseau, etc.).
-- ============================================================

-- 1) Nettoyage des doublons existants
WITH ranked AS (
  SELECT id, bot_id,
         ROW_NUMBER() OVER (PARTITION BY bot_id ORDER BY start_time DESC NULLS LAST, created_at DESC NULLS LAST) AS rn
  FROM public.arbitrage_sessions
  WHERE is_active = true AND bot_id IS NOT NULL
)
UPDATE public.arbitrage_sessions s
SET is_active = false, end_time = now()
FROM ranked r
WHERE s.id = r.id AND r.rn > 1;

-- 2) Empêche la création de plusieurs sessions actives pour un même bot
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_session_per_bot
  ON public.arbitrage_sessions (bot_id)
  WHERE is_active = true AND bot_id IS NOT NULL;
