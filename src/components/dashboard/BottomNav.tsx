import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Zap, Users, Wallet } from 'lucide-react';

const items = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Accueil', end: true },
  { to: '/dashboard/markets', icon: BarChart3, label: 'Marchés' },
  { to: '/dashboard/trade', icon: Zap, label: 'Trade' },
  { to: '/dashboard/network', icon: Users, label: 'Réseau' },
  { to: '/dashboard/portfolio', icon: Wallet, label: 'Actifs' },
];

// Barre de navigation basse mobile — reprend exactement la disposition de
// l'app de référence (5 icônes fines, actif en jaune, inactif en gris).
export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-stretch justify-between px-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
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
