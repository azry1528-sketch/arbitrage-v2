import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Lang = 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt';

const DICT: Record<Lang, Record<string, string>> = {
  fr: {
    home: 'Accueil', markets: 'Marchés', trader: 'Trade', assets: 'Actifs',
    network: 'Réseau', strategies: 'Stratégies', signals: 'Signaux',
    deposits: 'Dépôts', withdrawals: 'Retraits', profile: 'Profil',
    support: 'Support', adminSpace: 'Espace Admin', logout: 'Déconnexion',
    totalBalance: 'Solde total (USDT)', todayGain: "G et P aujourd'hui",
    announcements: 'Annonces',
  },
  en: {
    home: 'Home', markets: 'Markets', trader: 'Trade', assets: 'Assets',
    network: 'Network', strategies: 'Strategies', signals: 'Signals',
    deposits: 'Deposits', withdrawals: 'Withdrawals', profile: 'Profile',
    support: 'Support', adminSpace: 'Admin Space', logout: 'Log out',
    totalBalance: 'Total balance (USDT)', todayGain: "Today's P&L",
    announcements: 'Announcements',
  },
  es: {
    home: 'Inicio', markets: 'Mercados', trader: 'Trade', assets: 'Activos',
    network: 'Red', strategies: 'Estrategias', signals: 'Señales',
    deposits: 'Depósitos', withdrawals: 'Retiros', profile: 'Perfil',
    support: 'Soporte', adminSpace: 'Panel Admin', logout: 'Cerrar sesión',
    totalBalance: 'Saldo total (USDT)', todayGain: 'G/P de hoy',
    announcements: 'Anuncios',
  },
  de: {
    home: 'Start', markets: 'Märkte', trader: 'Trade', assets: 'Vermögen',
    network: 'Netzwerk', strategies: 'Strategien', signals: 'Signale',
    deposits: 'Einzahlungen', withdrawals: 'Auszahlungen', profile: 'Profil',
    support: 'Support', adminSpace: 'Admin-Bereich', logout: 'Abmelden',
    totalBalance: 'Gesamtguthaben (USDT)', todayGain: 'G&V heute',
    announcements: 'Ankündigungen',
  },
  it: {
    home: 'Home', markets: 'Mercati', trader: 'Trade', assets: 'Attività',
    network: 'Rete', strategies: 'Strategie', signals: 'Segnali',
    deposits: 'Depositi', withdrawals: 'Prelievi', profile: 'Profilo',
    support: 'Supporto', adminSpace: 'Area Admin', logout: 'Disconnetti',
    totalBalance: 'Saldo totale (USDT)', todayGain: 'Guadagno di oggi',
    announcements: 'Annunci',
  },
  pt: {
    home: 'Início', markets: 'Mercados', trader: 'Trade', assets: 'Ativos',
    network: 'Rede', strategies: 'Estratégias', signals: 'Sinais',
    deposits: 'Depósitos', withdrawals: 'Saques', profile: 'Perfil',
    support: 'Suporte', adminSpace: 'Área Admin', logout: 'Sair',
    totalBalance: 'Saldo total (USDT)', todayGain: 'Lucro de hoje',
    announcements: 'Anúncios',
  },
};

interface LanguageContextType {
  language: Lang;
  setLanguage: (l: Lang) => void;
  t: (key: string) => string;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function applyTheme(t: 'dark' | 'light') {
  document.documentElement.classList.toggle('light-theme', t === 'light');
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Lang>(
    () => (localStorage.getItem('app_language') as Lang) || 'fr'
  );
  const [theme, setThemeState] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('app_theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => { applyTheme(theme); }, []);

  const setLanguage = (l: Lang) => {
    setLanguageState(l);
    localStorage.setItem('app_language', l);
  };

  const setTheme = (t: 'dark' | 'light') => {
    setThemeState(t);
    localStorage.setItem('app_theme', t);
    applyTheme(t);
  };

  const t = (key: string) => DICT[language]?.[key] || DICT.fr[key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, theme, setTheme }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
