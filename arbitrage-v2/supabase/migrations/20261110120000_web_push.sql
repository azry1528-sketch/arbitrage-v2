-- =====================================================================
-- Web Push : abonnements navigateur + envoi automatique à chaque
-- nouvelle ligne de public.notifications (via l'Edge Function send-push)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON public.push_subscriptions(user_id);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()))
  WITH CHECK (user_id = public.get_profile_id(auth.uid()));

REVOKE ALL ON public.push_subscriptions FROM anon;

-- ---------------------------------------------------------------------
-- Réglages internes (URL de la fonction + secret partagé).
-- RLS activée sans policy : seul le service role / postgres y accède.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_settings (
  id             INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  function_url   TEXT NOT NULL,
  webhook_secret TEXT NOT NULL
);
ALTER TABLE public.push_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_settings FROM anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ---------------------------------------------------------------------
-- Trigger : chaque notification créée => push vers les appareils de l'user.
-- Ne bloque jamais l'insertion de la notification en cas d'erreur.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  s RECORD;
BEGIN
  SELECT function_url, webhook_secret INTO s FROM public.push_settings WHERE id = 1;
  IF s.function_url IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := s.function_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', s.webhook_secret),
    body    := jsonb_build_object(
      'user_id', NEW.user_id,
      'title',   NEW.title,
      'body',    NEW.message,
      'type',    NEW.type,
      'url',     '/dashboard'
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_push_on_notification() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_push ON public.notifications;
CREATE TRIGGER trg_notify_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.notify_push_on_notification();

-- ---------------------------------------------------------------------
-- À EXÉCUTER UNE FOIS (SQL Editor), en remplaçant les 2 valeurs :
--
-- INSERT INTO public.push_settings (id, function_url, webhook_secret)
-- VALUES (1,
--   'https://qnwhzajznkaflxciykay.supabase.co/functions/v1/send-push',
--   'UN_SECRET_LONG_ALEATOIRE')
-- ON CONFLICT (id) DO UPDATE
--   SET function_url = EXCLUDED.function_url, webhook_secret = EXCLUDED.webhook_secret;
-- ---------------------------------------------------------------------
