-- =====================================================================
-- 1) STRATEGIE DEFINIE A LA CREATION DU BOT
--    Chaque bot mémorise désormais la stratégie choisie à sa création
--    ainsi que ses paramètres de configuration spécifiques (JSON).
--    Ces valeurs restent modifiables après coup depuis les paramètres
--    du bot (cf. src/components/dashboard/BotEditDialog.tsx).
-- =====================================================================
ALTER TABLE public.bots
  ADD COLUMN IF NOT EXISTS strategy TEXT NOT NULL DEFAULT 'inter',
  ADD COLUMN IF NOT EXISTS strategy_config JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.bots.strategy IS 'Stratégie d''arbitrage choisie à la création du bot (inter, triangular, stat, mm)';
COMMENT ON COLUMN public.bots.strategy_config IS 'Paramètres de configuration propres à la stratégie choisie (éditables après création)';

-- =====================================================================
-- 2) PREFERENCE "NE PLUS AFFICHER" POUR LA POPUP D'ANNONCES A LA CONNEXION
--    Par défaut la popup s'affiche à chaque connexion ; l'utilisateur
--    peut choisir de ne plus la voir, ce qui est mémorisé sur son profil
--    (donc valable sur tous ses appareils, contrairement à un simple
--    stockage local dans le navigateur).
-- =====================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hide_announcements_popup BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.hide_announcements_popup IS 'Si vrai, la popup des annonces ne doit plus être affichée automatiquement à la connexion';

-- =====================================================================
-- 3) MONTANT MINIMUM ABAISSE A 1 USD (dépôts, retraits, capital de bot)
-- =====================================================================
-- Le capital alloué des bots doit rester positif (contrôle déjà en place),
-- la validation du montant minimum de 1$ est appliquée côté application.
