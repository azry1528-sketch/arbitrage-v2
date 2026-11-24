import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !!VAPID_PUBLIC_KEY
  );
}

/** Raison pour laquelle le push est indisponible (null si tout est OK). Pour le diagnostic. */
export function pushUnsupportedReason(): string | null {
  if (typeof window === 'undefined') return 'hors navigateur';
  if (!VAPID_PUBLIC_KEY) return 'VITE_VAPID_PUBLIC_KEY absente du build (ajoute-la puis rebuild/redéploie)';
  if (!window.isSecureContext) return 'HTTPS requis (contexte non sécurisé)';
  if (!('serviceWorker' in navigator)) return 'Service Worker non supporté';
  if (!('PushManager' in window)) return 'Push API non supportée (sur iPhone : installer l\'app sur l\'écran d\'accueil)';
  if (!('Notification' in window)) return 'Notification API non supportée';
  return null;
}

/** iOS : le push ne marche que si l'app est installée sur l'écran d'accueil. */
export function needsIosInstall(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  return ios && !standalone && !('PushManager' in window);
}

async function getRegistration() {
  return (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.ready);
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await getRegistration();
  return reg.pushManager.getSubscription();
}

async function saveSubscription(profileId: string, sub: PushSubscription) {
  const json = sub.toJSON();
  const { error } = await supabase.from('push_subscriptions' as any).upsert(
    {
      user_id: profileId,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      user_agent: navigator.userAgent.slice(0, 250),
    },
    { onConflict: 'endpoint' }
  );
  if (error) throw error;
}

/** Demande la permission, abonne le navigateur et enregistre l'abonnement. */
export async function enablePush(profileId: string): Promise<'granted' | 'denied' | 'default'> {
  if (!isPushSupported()) throw new Error('Notifications push non supportées sur cet appareil');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission;

  const reg = await getRegistration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!) as BufferSource,
    });
  }
  await saveSubscription(profileId, sub);
  return 'granted';
}

export async function disablePush(): Promise<void> {
  const sub = await getCurrentSubscription();
  if (!sub) return;
  await supabase.from('push_subscriptions' as any).delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}

/** À l'ouverture de l'app : si déjà autorisé, remet l'abonnement à jour en base. */
export async function syncPush(profileId: string): Promise<void> {
  if (!isPushSupported() || Notification.permission !== 'granted') return;
  const sub = await getCurrentSubscription();
  if (sub) await saveSubscription(profileId, sub);
}
