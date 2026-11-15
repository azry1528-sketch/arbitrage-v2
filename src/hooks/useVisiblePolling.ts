import { useEffect, useRef } from 'react';

/**
 * Appelle `callback` toutes les `intervalMs` ms, uniquement quand l'onglet est
 * visible. Quand l'onglet revient au premier plan, rafraîchit une fois puis
 * reprend le rythme normal. Évite des milliers de requêtes inutiles
 * (donc du Cached Egress) pour les onglets laissés ouverts en arrière-plan.
 */
export function useVisiblePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  deps: unknown[] = [],
  enabled = true,
) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => { void cbRef.current(); }, intervalMs);
    };
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else { void cbRef.current(); start(); }
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, enabled, ...deps]);
}
