-- =====================================================================
-- Correction : rétablir la résolution du parrainage à l'inscription.
--    Les migrations 20260711153735 et 20260712041640 redéfinissent
--    handle_new_user SANS la résolution du referral_code, ce qui
--    écrase la version corrigée de 20260731120000. Si elles sont
--    rejouées, le lien referred_by n'est plus posé et les filleuls
--    deviennent invisibles (et le bonus de parrainage sur dépôt ne
--    se déclenche jamais).
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_ref_code TEXT;
  v_referrer_id UUID;
BEGIN
  v_ref_code := NULLIF(TRIM(NEW.raw_user_meta_data->>'referral_code'), '');

  IF v_ref_code IS NOT NULL THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = v_ref_code
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (user_id, email, full_name, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_referrer_id
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
