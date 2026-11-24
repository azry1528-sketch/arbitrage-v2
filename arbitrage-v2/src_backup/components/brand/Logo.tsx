import { Link } from 'react-router-dom';

interface LogoProps {
  /** Hauteur du logo en px. */
  size?: number;
  /** Lien de destination (par défaut l'accueil). null = pas de lien. */
  to?: string | null;
  /** Affiche le logo complet (icône + COVESTING). false = icône seule. */
  showText?: boolean;
  /**
   * "dark"  : toujours la version blanche (fonds sombres : accueil, login, admin).
   * "auto"  : blanche en thème sombre, noire en thème clair (dashboard).
   */
  variant?: 'dark' | 'auto';
  className?: string;
  /** Conservé pour compatibilité : le nom est désormais dans l'image du logo. */
  textClassName?: string;
  onClick?: () => void;
}

const SRC = {
  full: {
    dark: '/images/logo/logo-wordmark-dark.png',
    light: '/images/logo/logo-wordmark-light.png',
    ratio: 363 / 96,
  },
  icon: {
    dark: '/images/logo/logo-icon-dark.png',
    light: '/images/logo/logo-icon-light.png',
    ratio: 320 / 384,
  },
};

// Logo officiel Covesting. Version complète : icône + "COVESTING" (même graphie
// que le logo officiel). Les classes logo-for-dark / logo-for-light sont
// basculées en CSS selon le thème (voir index.css).
export function Logo({
  size = 32,
  to = '/',
  showText = true,
  variant = 'auto',
  className = '',
  onClick,
}: LogoProps) {
  const s = showText ? SRC.full : SRC.icon;
  const dim = { height: size, width: Math.round(size * s.ratio) };
  const content = (
    <>
      <img
        src={s.dark}
        alt="Covesting"
        {...dim}
        style={dim}
        className="logo-for-dark shrink-0 object-contain"
      />
      {variant === 'auto' && (
        <img
          src={s.light}
          alt="Covesting"
          {...dim}
          style={dim}
          className="logo-for-light shrink-0 object-contain"
        />
      )}
    </>
  );
  const cls = `inline-flex items-center ${className}`;
  if (to === null) return <span className={cls}>{content}</span>;
  return (
    <Link to={to} onClick={onClick} className={cls} aria-label="Covesting">
      {content}
    </Link>
  );
}
