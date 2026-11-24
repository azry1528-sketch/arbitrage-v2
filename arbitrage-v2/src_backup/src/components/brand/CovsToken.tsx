import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TOKEN_SYMBOL } from '@/lib/brand';

// Pièce COVS : l'icône Covesting dans un médaillon.
export function CovsCoin({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full p-[2px] bg-[#FCD535] shrink-0 ${className}`}
    >
      <img
        src="/images/logo/covesting-icon.png"
        alt="COVS"
        className="w-full h-full rounded-full object-cover ring-1 ring-white/40"
      />
    </span>
  );
}

// Petit badge "Token COVS" à glisser n'importe où (titres, cartes, formulaires).
export function CovsBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#FCD535]/40 bg-[#FCD535]/15 pl-1 pr-3 py-0.5 text-xs font-semibold text-[#FCD535] ${className}`}
    >
      <CovsCoin className="w-5 h-5" />
      Token {TOKEN_SYMBOL}
    </span>
  );
}

interface CovsBannerProps {
  /** Lien du bouton d'action. */
  to?: string;
  cta?: string;
  className?: string;
  /** Version empilée, pour les colonnes étroites et les popups. */
  compact?: boolean;
}

// Bandeau d'information "Token COVS" — réutilisé sur l'accueil, la connexion,
// l'inscription et le dashboard. Couleurs liées au thème (clair / sombre) et
// bouton "En savoir plus" toujours visible, y compris sur téléphone.
export function CovsBanner({ to = '/register', cta = 'Découvrir COVS', className = '', compact = false }: CovsBannerProps) {
  const btnClass =
    'inline-flex items-center justify-center gap-1.5 shrink-0 rounded-lg bg-[#FCD535] hover:bg-[#FCD535]/80 text-[#181A20] text-sm font-semibold px-4 py-2 transition-colors';
  // Lien externe (ex. investing.com) : nouvel onglet ; sinon navigation interne.
  const button = /^https?:\/\//.test(to) ? (
    <a href={to} target="_blank" rel="noopener noreferrer" className={btnClass}>
      {cta} <ArrowRight className="w-4 h-4" />
    </a>
  ) : (
    <Link to={to} className={btnClass}>
      {cta} <ArrowRight className="w-4 h-4" />
    </Link>
  );

  if (compact) {
    return (
      <div
        className={`relative flex flex-col gap-3 overflow-hidden rounded-lg border border-[#FCD535]/40 bg-[#FCD535]/10 px-4 py-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <CovsCoin className="w-10 h-10" />
          <div className="min-w-0">
            <div className="text-sm font-bold text-foreground leading-snug">
              Token <span className="covs-accent">{TOKEN_SYMBOL}</span> — le token de l'écosystème Covesting
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Le {TOKEN_SYMBOL} est au cœur de la plateforme Covesting.
            </div>
          </div>
        </div>
        {button}
      </div>
    );
  }
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-[#FCD535]/40 bg-[#FCD535]/10 p-4 md:p-5 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <CovsCoin className="w-12 h-12 md:w-14 md:h-14" />
          <div className="flex-1 min-w-0">
            <div className="text-sm md:text-base font-bold text-foreground">
              Token <span className="covs-accent">{TOKEN_SYMBOL}</span> — le token de l'écosystème Covesting
            </div>
            <div className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Le {TOKEN_SYMBOL} est au cœur de la plateforme Covesting.
            </div>
          </div>
        </div>
        {button}
      </div>
    </div>
  );
}
