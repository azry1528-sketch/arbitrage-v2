-- =====================================================================
-- KYC : colonnes, bucket privé, policies + protection des colonnes sensibles.
-- Idempotent (IF NOT EXISTS / DROP IF EXISTS) : sans risque si déjà en place.
-- =====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'not_submitted',
  ADD COLUMN IF NOT EXISTS kyc_full_name TEXT,
  ADD COLUMN IF NOT EXISTS kyc_document_type TEXT,
  ADD COLUMN IF NOT EXISTS kyc_document_number TEXT,
  ADD COLUMN IF NOT EXISTS kyc_country TEXT,
  ADD COLUMN IF NOT EXISTS kyc_document_front_url TEXT,
  ADD COLUMN IF NOT EXISTS kyc_document_back_url TEXT,
  ADD COLUMN IF NOT EXISTS kyc_selfie_url TEXT,
  ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;

-- Bucket privé pour les documents (dossier = id du profil)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "kyc_user_insert" ON storage.objects;
CREATE POLICY "kyc_user_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "kyc_user_update" ON storage.objects;
CREATE POLICY "kyc_user_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "kyc_select" ON storage.objects;
CREATE POLICY "kyc_select" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR (storage.foldername(name))[1] IN (SELECT id::text FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- Protection : un utilisateur ne peut pas modifier lui-même son solde,
-- ses blocages ni valider son propre KYC. Seul un admin (ou une fonction
-- SECURITY DEFINER / service role) le peut.
-- Seule exception : soumettre son KYC (not_submitted/rejected -> pending).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Appels directs depuis le client uniquement ; les fonctions SECURITY DEFINER
  -- (bots, parrainage, triggers) et le service role ne sont pas concernés.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.balance IS DISTINCT FROM OLD.balance
     OR NEW.total_earnings IS DISTINCT FROM OLD.total_earnings
     OR NEW.is_blocked IS DISTINCT FROM OLD.is_blocked
     OR NEW.withdrawals_blocked IS DISTINCT FROM OLD.withdrawals_blocked
     OR NEW.kyc_rejection_reason IS DISTINCT FROM OLD.kyc_rejection_reason THEN
    RAISE EXCEPTION 'colonne_protegee' USING ERRCODE = '42501';
  END IF;

  IF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status THEN
    IF NOT (NEW.kyc_status = 'pending' AND OLD.kyc_status IN ('not_submitted', 'rejected')) THEN
      RAISE EXCEPTION 'colonne_protegee' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_profile_sensitive_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_profile_sensitive ON public.profiles;
CREATE TRIGGER trg_protect_profile_sensitive
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_sensitive_columns();
