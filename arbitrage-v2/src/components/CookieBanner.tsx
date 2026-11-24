import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';

const KEY = 'cookie_consent'; // 'accepted' | 'refused'

/** Lecture du choix (à utiliser avant de charger tout outil de mesure d'audience). */
export function getCookieConsent(): 'accepted' | 'refused' | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'accepted' || v === 'refused' ? v : null;
  } catch {
    return null;
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getCookieConsent() === null);
  }, []);

  const choose = (value: 'accepted' | 'refused') => {
    try { localStorage.setItem(KEY, value); } catch { /* stockage indisponible */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div role="dialog" aria-label="Cookies" className="fixed inset-x-3 bottom-3 z-[60] md:left-auto md:right-4 md:bottom-4 md:max-w-md rounded-xl border border-border bg-card p-4 shadow-xl pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-start gap-3">
        <Cookie className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Cookies et stockage local</p>
          <p className="text-xs text-muted-foreground mt-1">
            Covesting utilise des cookies et le stockage local nécessaires au fonctionnement du site (connexion, langue, thème).
            Avec votre accord, nous pourrons aussi mesurer l'audience pour améliorer la plateforme. Aucun cookie publicitaire n'est utilisé.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="h-8 text-xs" onClick={() => choose('accepted')}>Tout accepter</Button>
            <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => choose('refused')}>Nécessaires uniquement</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
