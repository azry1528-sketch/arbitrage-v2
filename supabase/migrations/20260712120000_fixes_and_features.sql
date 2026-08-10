-- =====================================================================
-- Fix critical bug: notification trigger functions insert a "metadata"
-- column that never existed on public.notifications. This makes every
-- INSERT/UPDATE on deposits, withdrawals and investments fail (the
-- AFTER trigger errors and rolls back the whole transaction), which is
-- why users could not create deposits or withdrawals.
-- =====================================================================
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- =====================================================================
-- Withdrawal security: withdrawal password + saved withdrawal address
-- =====================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS withdrawal_password TEXT,
  ADD COLUMN IF NOT EXISTS withdrawal_address TEXT;

-- =====================================================================
-- Referral codes must start with "ARBITRAGE-"
-- =====================================================================
ALTER TABLE public.profiles
  ALTER COLUMN referral_code SET DEFAULT ('ARBITRAGE-' || upper(encode(gen_random_bytes(4), 'hex')));

UPDATE public.profiles
SET referral_code = 'ARBITRAGE-' || upper(encode(gen_random_bytes(4), 'hex'))
WHERE referral_code IS NULL OR referral_code NOT ILIKE 'arbitrage%';

-- =====================================================================
-- Welcome notification on signup (works for email + OAuth signups)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_profile_id UUID;
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  RETURNING id INTO new_profile_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN NEW.email IN ('admin@arbitragex.com', 'tchapmoguy@gmail.com')
         THEN 'admin'::app_role ELSE 'user'::app_role END
  );

  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    new_profile_id,
    'welcome',
    '🎉 Bienvenue sur ArbitrageX !',
    'Votre compte a été créé avec succès. Effectuez votre premier dépôt pour démarrer l''arbitrage automatisé.',
    '{}'::jsonb
  );

  RETURN NEW;
END;
$function$;

-- =====================================================================
-- Announcements shown on the dashboard home page
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view active announcements" ON public.announcements;
CREATE POLICY "Anyone authenticated can view active announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
CREATE POLICY "Admins manage announcements"
  ON public.announcements FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.announcements (title, message)
SELECT '🚀 Bienvenue sur ArbitrageX', 'Notre moteur d''arbitrage inter-exchanges est actif 24/7. Déposez dès aujourd''hui pour commencer à générer des gains.'
WHERE NOT EXISTS (SELECT 1 FROM public.announcements);

-- =====================================================================
-- Avatar storage bucket for profile photos
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
