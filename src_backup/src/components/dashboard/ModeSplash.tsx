import { useCallback, useEffect, useState } from 'react';
import { Logo } from '@/components/brand/Logo';

export type AppMode = 'exchange' | 'wallet';

const EVENT = 'covesting:mode-splash';
const DURATION = 1400;

// Déclenche l'écran « Bienvenue sur … » (appelé par la bascule Exchange / Portefeuille).
export function triggerModeSplash(mode: AppMode) {
  window.dispatchEvent(new CustomEvent<AppMode>(EVENT, { detail: mode }));
}

// Écran de bienvenue plein écran, affiché à chaque changement de mode :
//   Portefeuille -> Exchange : « Bienvenue sur COVESTING »
//   Exchange -> Portefeuille : « Bienvenue sur COVESTING Wallet »
export function ModeSplash() {
  const [mode, setMode] = useState<AppMode | null>(null);
  const [run, setRun] = useState(0); // relance le minuteur si on rebascule vite

  useEffect(() => {
    const onSplash = (e: Event) => {
      setMode((e as CustomEvent<AppMode>).detail);
      setRun((n) => n + 1);
    };
    window.addEventListener(EVENT, onSplash);
    return () => window.removeEventListener(EVENT, onSplash);
  }, []);

  const close = useCallback(() => setMode(null), []);

  useEffect(() => {
    if (!mode) return;
    const t = setTimeout(close, DURATION);
    return () => clearTimeout(t);
  }, [mode, run, close]);

  if (!mode) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-background flex items-center px-7 animate-in fade-in duration-200"
      role="status"
      aria-label={mode === 'wallet' ? 'Chargement du portefeuille' : "Chargement de l'exchange"}
    >
      <div>
        <div className="text-lg text-foreground mb-3">Bienvenue sur</div>
        <div className="flex items-center gap-3">
          <Logo size={34} to={null} variant="auto" />
          {mode === 'wallet' && <span className="text-3xl font-light text-foreground">Wallet</span>}
        </div>
      </div>
    </div>
  );
}
