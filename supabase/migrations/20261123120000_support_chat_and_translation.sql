-- =====================================================================
-- 1) Support en mode DISCUSSION (une conversation par utilisateur)
-- 2) Pont Telegram (admins liés + correspondance message Telegram -> utilisateur)
-- 3) Cache global des traductions automatiques
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.support_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender     TEXT NOT NULL CHECK (sender IN ('user', 'admin')),
  body       TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_messages_user ON public.support_messages(user_id, created_at);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own support messages" ON public.support_messages;
CREATE POLICY "Users read own support messages" ON public.support_messages
  FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage support messages" ON public.support_messages;
CREATE POLICY "Admins manage support messages" ON public.support_messages
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- Les utilisateurs n'écrivent PAS directement : l'envoi passe par la fonction support-send.
REVOKE ALL ON public.support_messages FROM anon;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.telegram_admins (
  chat_id    BIGINT PRIMARY KEY,
  label      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.telegram_message_map (
  chat_id    BIGINT NOT NULL,
  message_id BIGINT NOT NULL,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (chat_id, message_id)
);

-- Tables internes : aucune policy = accessibles uniquement par le service_role (Edge Functions)
ALTER TABLE public.telegram_admins      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_message_map ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.telegram_admins, public.telegram_message_map FROM anon, authenticated;

-- Traductions automatiques : cache partagé entre tous les utilisateurs
CREATE TABLE IF NOT EXISTS public.translations_cache (
  lang       TEXT NOT NULL,
  src_hash   TEXT NOT NULL,
  src        TEXT NOT NULL,
  tr         TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (lang, src_hash)
);
CREATE TABLE IF NOT EXISTS public.translate_usage (
  bucket     TEXT PRIMARY KEY,           -- ip|heure
  calls      INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.translations_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translate_usage    ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.translations_cache, public.translate_usage FROM anon, authenticated;
