import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  isPushSupported, needsIosInstall, getCurrentSubscription, enablePush, disablePush, syncPush,
} from '@/lib/push';

// Interrupteur « Notifications push » (Paramètres).
export function PushSettingsRow() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const supported = isPushSupported();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile?.id || !supported) return;
    syncPush(profile.id).catch(() => {});
    getCurrentSubscription().then((s) => setOn(!!s && Notification.permission === 'granted')).catch(() => {});
  }, [profile?.id, supported]);

  const toggle = async (next: boolean) => {
    if (!profile?.id) return;
    setBusy(true);
    try {
      if (!next) {
        await disablePush();
        setOn(false);
        toast({ title: 'Notifications push désactivées' });
      } else {
        const res = await enablePush(profile.id);
        if (res === 'granted') {
          setOn(true);
          toast({ title: 'Notifications push activées' });
        } else {
          toast({ title: 'Autorisation refusée', description: 'Autorise les notifications dans les réglages du navigateur.', variant: 'destructive' });
        }
      }
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message || 'Impossible de modifier les notifications push', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="push-switch">Notifications push</Label>
        <Switch id="push-switch" checked={on} disabled={!supported || busy} onCheckedChange={toggle} />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {supported
          ? 'Recevez chaque jour les infos de la plateforme : marchés, gains, annonces.'
          : needsIosInstall()
            ? "Sur iPhone, installez d'abord l'app sur l'écran d'accueil pour activer les notifications push."
            : 'Notifications push indisponibles sur ce navigateur.'}
      </p>
    </div>
  );
}
