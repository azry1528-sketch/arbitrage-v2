-- Droits explicites sur support_messages (idempotent).
-- Sans eux, selon la configuration du projet, l'API peut refuser la lecture du chat
-- (utilisateur) ou l'insertion d'une réponse (admin). Les policies RLS restent seules
-- juges : un utilisateur ne peut toujours que LIRE ses propres messages, l'écriture
-- côté utilisateur passe par la fonction support-send (service_role).
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;

-- S'assure que la table est bien diffusée en temps réel (réponses instantanées dans le chat).
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
