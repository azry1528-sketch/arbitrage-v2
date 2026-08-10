-- ============================================================
-- FIX RACINE : "record \"new\" has no field \"updated_at\""
--
-- La migration 20260712050415 a attaché un trigger générique
-- set_updated_at (BEFORE UPDATE ... SET NEW.updated_at = now())
-- à plusieurs tables, dont public.arbitrage_sessions. Mais cette
-- table n'a jamais eu de colonne updated_at.
--
-- Conséquence : TOUTE requête UPDATE sur arbitrage_sessions
-- échouait avec l'erreur Postgres 42703 (colonne inexistante).
-- C'est la vraie raison pour laquelle cliquer sur "Arrêter" ne
-- désactivait jamais réellement la session en base : la requête
-- échouait silencieusement côté serveur (400 côté client), donc
-- is_active restait à true et le moteur (pg_cron) continuait de
-- générer des trades.
-- ============================================================

ALTER TABLE public.arbitrage_sessions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
