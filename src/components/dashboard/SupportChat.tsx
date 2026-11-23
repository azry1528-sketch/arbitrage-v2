import { useEffect, useRef, useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Msg { id: string; sender: 'user' | 'admin'; body: string; created_at: string }

/** Support en mode discussion : un seul fil par utilisateur, réponses en temps réel. */
export function SupportChat() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const addMessage = (m: Msg) => setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));

  useEffect(() => {
    if (!profile?.id) return;
    supabase.from('support_messages' as any).select('*').eq('user_id', profile.id)
      .order('created_at', { ascending: true }).limit(300)
      .then(({ data }) => setMessages((data as any) || []));

    const channel = supabase.channel(`support-${profile.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `user_id=eq.${profile.id}` },
        (payload) => addMessage(payload.new as Msg))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

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

  return (
    <div className="glass-card flex flex-col h-[70vh] min-h-[420px] overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary" />
        <div>
          <div className="font-semibold text-sm">Discussion avec le support</div>
          <div className="text-[11px] text-muted-foreground">Écrivez votre message, l'équipe vous répond ici.</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">
            Aucun message pour l'instant. Posez votre question, nous vous répondons dans cette conversation.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
              m.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-secondary rounded-bl-sm'
            }`}>
              {m.sender === 'admin' && <div className="text-[10px] font-semibold text-primary mb-0.5">Support Covesting</div>}
              {m.body}
              <div className={`text-[10px] mt-1 ${m.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {new Date(m.created_at).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-border flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Votre message..."
          rows={1}
          maxLength={2000}
          className="flex-1 resize-none max-h-32 px-3 py-2.5 rounded-lg bg-input border border-border input-premium text-sm"
        />
        <Button className="btn-gold h-10" onClick={send} disabled={sending || !text.trim()} aria-label="Envoyer">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
