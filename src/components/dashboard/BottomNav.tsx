import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Zap, Users, Wallet, Home, LineChart, Compass } from 'lucide-react';

const exchangeItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Accueil', end: true },
  { to: '/dashboard/strategy', icon: LineChart, label: 'Marchés' },
  { to: '/dashboard/trade', icon: Zap, label: 'Trade' },
  { to: '/dashboard/network', icon: Users, label: 'Réseau' },
  { to: '/dashboard/portfolio', icon: Wallet, label: 'Actifs' },
];

// Mode Portefeuille : Accueil / Marchés / Trader / Découvrir / Actifs
const walletItems = [
  { to: '/dashboard/portefeuille', icon: Home, label: 'Accueil', end: true },
  { to: '/dashboard/portefeuille/marches', icon: LineChart, label: 'Marchés' },
  { to: '/dashboard/portefeuille/trader', icon: Zap, label: 'Trader' },
  { to: '/dashboard/portefeuille/decouvrir', icon: Compass, label: 'Découvrir' },
  { to: '/dashboard/portefeuille/actifs', icon: Wallet, label: 'Actifs' },
];

// Barre de navigation basse mobile — 5 icônes fines, actif en jaune, inactif en gris.
export function BottomNav() {
  const { pathname } = useLocation();
  const walletMode = pathname.startsWith('/dashboard/portefeuille');
  const items = walletMode ? walletItems : exchangeItems;

  const isActive = (_to: string, routerActive: boolean) => routerActive;

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 border-t border-border">
      <div className="flex items-stretch justify-between px-2">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={(item as any).end}
            className={({ isActive: ra }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors duration-200 ${
                isActive(item.to, ra) ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            <item.icon className="w-5 h-5" strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </div>
      {/* Encoche de sécurité iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
