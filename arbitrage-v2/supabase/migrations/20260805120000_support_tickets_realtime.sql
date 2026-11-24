-- Le widget de chat client (SupportChatWidget) s'abonne aux changements de
-- public.support_tickets via postgres_changes, mais la table n'avait jamais
-- ete ajoutee a la publication realtime : les reponses de l'admin
-- (UPDATE admin_response) n'etaient donc jamais poussees en direct au client.
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;

-- Necessaire pour que les evenements UPDATE contiennent les colonnes
-- completes (utile pour le filtre user_id=eq.<id> cote client).
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
