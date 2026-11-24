import { Link, useLocation } from 'react-router-dom';
import { triggerModeSplash } from '@/components/dashboard/ModeSplash';

// Bascule Exchange / Portefeuille (en-tête du dashboard).
export function ModeSwitch({ className = '' }: { className?: string }) {
  const { pathname } = useLocation();
  const wallet = pathname.startsWith('/dashboard/portefeuille');
  const base = 'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap';
  return (
    <div className={`inline-flex items-center rounded-xl bg-secondary/70 border border-border p-1 ${className}`}>
      <Link to="/dashboard" onClick={() => wallet && triggerModeSplash('exchange')} className={`${base} ${!wallet ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
        Exchange
      </Link>
      <Link to="/dashboard/portefeuille" onClick={() => !wallet && triggerModeSplash('wallet')} className={`${base} ${wallet ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
        Portefeuille
      </Link>
    </div>
  );
}
