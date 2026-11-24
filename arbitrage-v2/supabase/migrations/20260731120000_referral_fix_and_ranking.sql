-- ---------------------------------------------------------------------
-- 1) Correction du bug de parrainage.
--
-- Cause racine : à l'inscription, le front-end faisait un SELECT sur
-- public.profiles pour retrouver le parrain via son referral_code,
-- PUIS un UPDATE pour lier le nouveau compte (referred_by). Or la
-- policy RLS "Users can view own profile" limite le SELECT à
-- auth.uid() = user_id : un nouvel utilisateur ne peut donc JAMAIS
-- lire la ligne du parrain, la recherche renvoie 0 ligne, et le lien
-- referred_by n'est jamais posé. Le filleul semble alors invisible.
--
-- Correctif : on résout le code de parrainage côté serveur, au moment
-- même de la création du profil (trigger handle_new_user), qui
-- s'exécute en SECURITY DEFINER et n'est donc pas soumis à la RLS.
-- Le code parrain est transmis via les métadonnées de auth.users
-- (raw_user_meta_data ->> 'referral_code'), renseignées par le
-- front-end au moment du signUp().
-- ---------------------------------------------------------------------

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

-- ---------------------------------------------------------------------
-- 2) Filleuls : le parrain doit pouvoir voir le solde et quelques
-- informations de ses filleuls. Comme pour le bug ci-dessus, la RLS
-- interdit à un utilisateur de lire le profil d'un autre — on expose
-- donc une fonction SECURITY DEFINER qui ne renvoie QUE les colonnes
-- non sensibles (jamais withdrawal_password, withdrawal_address, etc.)
-- et uniquement pour les lignes dont referred_by = le profil de
-- l'appelant.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_referrals()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ,
  balance NUMERIC,
  total_earnings NUMERIC,
  is_blocked BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.email, p.created_at, p.balance, p.total_earnings, p.is_blocked
  FROM public.profiles p
  WHERE p.referred_by = public.get_profile_id(auth.uid())
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_referrals() TO authenticated;

-- ---------------------------------------------------------------------
-- 3) Classement des traders : dynamique, basé sur les vrais gains
-- (total_earnings), calculé côté serveur (même contrainte RLS que
-- ci-dessus : un utilisateur normal ne peut pas lister les autres
-- profils). Le classement trie par total_earnings décroissant, puis
-- par ancienneté du compte (created_at croissant) pour départager les
-- égalités. Conséquence : un compte fraîchement créé (0$ de gains,
-- date la plus récente) se retrouve systématiquement à la toute
-- dernière position du classement.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_traders_ranking()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  total_earnings NUMERIC,
  rank BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.total_earnings,
    ROW_NUMBER() OVER (ORDER BY COALESCE(p.total_earnings, 0) DESC, p.created_at ASC) AS rank
  FROM public.profiles p
  WHERE COALESCE(p.is_blocked, false) = false;
$$;

GRANT EXECUTE ON FUNCTION public.get_traders_ranking() TO authenticated;
