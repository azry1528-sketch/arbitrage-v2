import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  admin_response: string | null;
  status: string | null;
  created_at: string | null;
}

// Bouton flottant + popup de chat, en bas à droite, réutilise la table support_tickets
export function SupportChatWidget() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true });
    setTickets(data || []);
  };

  useEffect(() => { if (open && profile) fetchTickets(); }, [open, profile]);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel('support_tickets_widget')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${profile.id}` }, () => fetchTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [tickets, open]);

  const send = async () => {
    if (!text.trim() || !profile) return;
    setSending(true);
    const { error } = await supabase.from('support_tickets').insert({
      user_id: profile.id,
      subject: 'Chat en direct',
      message: text.trim(),
    });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setText('');
      fetchTickets();
    }
    setSending(false);
  };

  if (!profile) return null;

  return (
    <>
      {/* Bouton flottant */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-11 h-11 rounded-full btn-gold shadow-lg flex items-center justify-center"
        aria-label="Discuter avec le service client"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="w-5 h-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Popup de chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-36 right-4 lg:bottom-24 lg:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm h-[28rem] glass-card rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border"
          >
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-secondary/30">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <div className="font-semibold text-sm">Service client</div>
                <div className="text-[11px] text-muted-foreground">Réponse sous 24-48h</div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {tickets.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  Écrivez-nous, un conseiller vous répondra bientôt.
                </p>
              ) : (
                tickets.map((t) => (
                  <div key={t.id} className="space-y-1.5">
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-3 py-2 text-sm">
                        {t.message}
                      </div>
                    </div>
                    {t.admin_response && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-secondary px-3 py-2 text-sm">
                          {t.admin_response}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-border flex items-center gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !sending) send(); }}
                placeholder="Écrivez votre message..."
                className="flex-1 px-3 py-2 rounded-lg bg-input border border-border input-premium text-sm"
              />
              <button
                onClick={send}
                disabled={sending || !text.trim()}
                className="w-9 h-9 rounded-lg btn-gold flex items-center justify-center shrink-0 disabled:opacity-50"
                aria-label="Envoyer"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
