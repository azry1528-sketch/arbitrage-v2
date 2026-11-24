// Capture l'événement natif d'installation PWA (Chrome/Edge/Android) le plus
// tôt possible dans le cycle de vie de l'app, pour pouvoir le déclencher plus
// tard (par ex. dans une popup affichée après connexion/inscription), même si
// le composant qui l'utilise n'était pas encore monté quand l'événement a été
// émis par le navigateur.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let alreadyInstalled = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    alreadyInstalled = true;
    deferredPrompt = null;
    notify();
  });
}

/** L'app tourne-t-elle déjà en mode "installé" (standalone) ? */
export function isAppInstalled(): boolean {
  if (alreadyInstalled) return true;
  if (typeof window === 'undefined') return false;
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari expose ce flag quand l'app a été ajoutée à l'écran d'accueil
  if ((window.navigator as any).standalone === true) return true;
  return false;
}

/** Le navigateur a-t-il proposé le prompt natif d'installation ? */
export function hasNativeInstallPrompt(): boolean {
  return deferredPrompt !== null;
}

/** S'abonner aux changements (prompt disponible / app installée). */
export function onPwaInstallEvent(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Déclenche le prompt natif d'installation (Chrome/Edge/Android uniquement). */
export async function triggerNativeInstallPrompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  await deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return choice.outcome;
}

export function getPlatformInfo() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ se déclare comme "Mac" mais supporte le multi-touch
    (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
  const isAndroid = /android/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|chromium|crios|edg/i.test(ua);
  const isFirefox = /firefox/i.test(ua);
  return { isIOS, isAndroid, isSafari, isFirefox };
}
