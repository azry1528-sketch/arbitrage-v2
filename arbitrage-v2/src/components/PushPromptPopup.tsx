import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PopupButton } from '@/components/ui/popup';
import { BellRing, TrendingUp, Wallet, Megaphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { isPushSupported, getCurrentSubscription, enablePush } from '@/lib/push';

const DISMISS_KEY = 'push_prompt_dismissed_at';
const REPROMPT_DAYS = 7;

/**
 * Popup « Activer les rappels » : propose les notifications push une fois que
 * la popup d'installation est passée. Elle ne s'affiche que si le push est
 * possible sur l'appareil, pas encore activé, pas refusé, et pas écarté
 * récemment (on ne redemande qu'après 7 jours).
 */
export function PushPromptPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [eligible, setEligible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !profile?.id) return;
    let cancelled = false;
    (async () => {
      try {
        if (!isPushSupported() || Notification.permission !== 'default') return onClose();
        const last = Number(localStorage.getItem(DISMISS_KEY) || 0);
        if (last && Date.now() - last < REPROMPT_DAYS * 86400000) return onClose();
        const sub = await getCurrentSubscription();
        if (sub) return onClose();
        if (!cancelled) setEligible(true);
      } catch {
        onClose();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profile?.id]);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* stockage indisponible */ }
    setEligible(false);
    onClose();
  };

  const activate = async () => {
    if (!profile?.id) return;
    setBusy(true);
    try {
      const res = await enablePush(profile.id);
      if (res === 'granted') {
        toast({ title: 'Rappels activés', description: 'Vous serez prévenu des dépôts, retraits et nouveautés.' });
      } else {
        toast({ title: 'Autorisation refusée', description: 'Vous pouvez les activer plus tard dans Paramètres.', variant: 'destructive' });
      }
      setEligible(false);
      onClose();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message || "Impossible d'activer les rappels", variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (!open || !eligible) return null;

  return (
    <Dialog open onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent hideClose className="sm:max-w-sm">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-primary/15 flex items-center justify-center">
            <BellRing className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle>Activer les rappels</DialogTitle>
          <DialogDescription className="mt-2">
            Recevez une notification sur votre appareil, même quand l'application est fermée.
          </DialogDescription>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl bg-secondary/50 p-3 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-primary shrink-0" /> Confirmation de vos dépôts et retraits</div>
            <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary shrink-0" /> Un point marché par jour</div>
            <div className="flex items-center gap-2"><Megaphone className="w-4 h-4 text-primary shrink-0" /> Les nouveautés de la plateforme</div>
          </div>
          <PopupButton onClick={activate} disabled={busy}>
            <BellRing className="w-4 h-4" />
            {busy ? 'Activation...' : 'Activer les rappels'}
          </PopupButton>
          <PopupButton variant="secondary" onClick={dismiss}>Plus tard</PopupButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
