import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Msg {
  id: string;
  sender: 'user' | 'admin';
  body: string;
  created_at: string;
}

// Bouton flottant + popup de chat, en bas à droite.
// Utilise la même conversation que la page Support (table support_messages) :
// les réponses envoyées depuis l'espace admin ou Telegram apparaissent ici en temps réel.
export function SupportChatWidget() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [unread, setUnread] = useState(0);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const addMessage = (m: Msg) =>
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));

  useEffect(() => {
    if (!profile?.id) return;

    supabase
      .from('support_messages' as any)
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true })
      .limit(300)
      .then(({ data }) => setMessages((data as any) || []));

    const channel = supabase
      .channel(`support-widget-${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          const m = payload.new as Msg;
          addMessage(m);
          if (m.sender === 'admin' && !openRef.current) setUnread((n) => n + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, open]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('support-send', { body: { message: body } });
      let msg = (data as any)?.error as string | undefined;
      if (error && !msg) {
        try { msg = (await (error as any).context.json())?.error; } catch { msg = error.message; }
      }
      if (msg) throw new Error(msg);
      if ((data as any)?.message) addMessage((data as any).message);
      setText('');
    } catch (e: any) {
      toast({ title: 'Message non envoyé', description: e?.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
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
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </motion.button>

      {/* Popup de chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-36 right-4 lg:bottom-24 lg:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm h-[28rem] glass-card rounded-lg shadow-2xl flex flex-col overflow-hidden border border-border"
          >
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-secondary/30">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <div className="font-semibold text-sm">Service client</div>
                <div className="text-[11px] text-muted-foreground">Réponse sous 24-48h</div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  Écrivez-nous, un conseiller vous répondra bientôt.
                </p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                        m.sender === 'user'
                          ? 'rounded-lg rounded-tr-sm bg-primary text-primary-foreground'
                          : 'rounded-lg rounded-tl-sm bg-secondary'
                      }`}
                    >
                      {m.body}
                    </div>
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
                maxLength={2000}
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
