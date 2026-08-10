import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, LayoutDashboard, Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle,
  Users, Settings, LogOut, Menu, MessageCircle, Play, Pause, Copy,
  CheckCircle2, Clock, XCircle, Loader2, BarChart3, Signal, Layers, Bot,
  LineChart, User, ScanLine, Send, Camera, Eye, EyeOff, KeyRound, Search,
  Sun, Moon, Star, HelpCircle, ChevronRight, Download, ChevronLeft,
  PieChart as PieChartIcon, RefreshCw, AlertCircle
, ShieldCheck, Megaphone } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer as PieResponsiveContainer, Tooltip as PieTooltip, Legend as PieLegend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useToast } from '@/hooks/use-toast';
import { sanitizeDecimalInput } from '@/lib/utils';
import { validateWalletAddress, getWalletAddressError } from '@/lib/walletValidation';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { TradersRanking } from '@/components/dashboard/TradersRanking';
import { DashboardTicker } from '@/components/dashboard/DashboardTicker';
import { MarketMovers } from '@/components/dashboard/MarketMovers';
import { WatchlistSheet } from '@/components/dashboard/WatchlistSheet';
import { AppearanceSheet } from '@/components/dashboard/AppearanceSheet';
import { RecentActivityBanner } from '@/components/dashboard/RecentActivityBanner';
import { BalanceSparkline } from '@/components/dashboard/BalanceSparkline';
import { ActiveBotsWidget } from '@/components/dashboard/ActiveBotsWidget';
import { RecentTransactionsFeed } from '@/components/dashboard/RecentTransactionsFeed';
import { MarketMoodBadge } from '@/components/dashboard/MarketMoodBadge';
import { PlatformSpread } from '@/components/dashboard/PlatformSpread';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { TradingViewChart } from '@/components/dashboard/TradingViewChart';
import { OrderForm } from '@/components/dashboard/OrderForm';
import { TradingPanel } from '@/components/dashboard/TradingPanel';
import { SupportChatWidget } from '@/components/support/SupportChatWidget';
import { Announcements } from '@/components/dashboard/Announcements';
import { TutorialDialog } from '@/components/dashboard/TutorialDialog';
import { AnnouncementsDialog } from '@/components/dashboard/AnnouncementsDialog';
import { InstallAppPopup } from '@/components/InstallAppPopup';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrading } from '@/contexts/TradingContext';
import MarketsPage from './dashboard/MarketsPage';
import StrategyPage from './dashboard/StrategyPage';
import SignalsPage from './dashboard/SignalsPage';
import BotsPage from './dashboard/BotsPage';
import BotDetailPage from './dashboard/BotDetailPage';
import AnnouncementsPage from './dashboard/AnnouncementsPage';
import { KYCVerification } from '@/components/dashboard/KYCVerification';

// ================= Overview (Home) =================
function DashboardOverview() {
  const { profile, refreshProfile } = useAuth();
  const { prices } = useCryptoPrices();
  const { t } = useLanguage();
  const [todayGain, setTodayGain] = useState(0);
  const [displayCurrency, setDisplayCurrency] = useState<'USDT' | 'BTC'>('USDT');
  const [hideBalance, setHideBalance] = useState(false);

  const loadTodayGain = async () => {
    if (!profile) return;
    const { data: creditedInvestments } = await supabase.rpc('calculate_daily_returns' as any, { _user_id: profile.id });
    if (creditedInvestments && (creditedInvestments as any[]).length > 0) await refreshProfile();

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

    // G&P calculé directement à partir des trades du jour (source de vérité en
    // temps réel), plutôt que de dépendre uniquement du cache daily_snapshots
    // qui peut être en retard si le trigger de crédit n'a pas encore tourné.
    const { data: trades } = await supabase
      .from('arbitrage_trades')
      .select('profit, arbitrage_sessions!inner(user_id)')
      .eq('arbitrage_sessions.user_id', profile.id)
      .gte('executed_at', startOfDay.toISOString());

    const tradesGain = (trades || []).reduce((sum: number, t: any) => sum + Number(t.profit || 0), 0);
    const investmentGain = ((creditedInvestments as any[]) || []).reduce((sum: number, i: any) => sum + Number(i.amount_credited || 0), 0);

    setTodayGain(tradesGain + investmentGain);
  };

  useEffect(() => {
    loadTodayGain();
    const timer = setInterval(loadTodayGain, 8000);
    return () => clearInterval(timer);
  }, [profile?.id]);

  const balance = Number(profile?.balance || 0);
  const todayPct = balance > 0 ? ((todayGain / balance) * 100).toFixed(2) : '0.00';
  const positive = todayGain >= 0;
  const btcPrice = prices.find((p) => p.id === 'bitcoin')?.current_price;

  const quickActions = [
    { icon: Users, label: 'Parrainage', to: '/dashboard/network' },
    { icon: Wallet, label: 'Actifs', to: '/dashboard/portfolio' },
    { icon: Zap, label: 'Trade', to: '/dashboard/trade' },
    { icon: Layers, label: 'Stratégies', to: '/dashboard/strategy' },
    { icon: Bot, label: 'Bots', to: '/dashboard/trade?tab=automatique' },
    { icon: MessageCircle, label: 'Support', to: '/dashboard/support' },
  ];

  return (
    <div className="w-full space-y-5">
      {/* Ligne principale — solde à gauche (large), widgets clés à droite. Pleine largeur sur PC au lieu d'une colonne centrée */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-8 rounded-[20px] p-6 md:p-8 bg-card border border-border/60 flex flex-col">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {t('totalBalance')}
              <Select value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as 'USDT' | 'BTC')}>
                <SelectTrigger className="h-6 w-auto gap-1 border-none bg-transparent px-1.5 py-0 text-xs text-muted-foreground hover:text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                </SelectContent>
              </Select>
              <button onClick={() => setHideBalance((v) => !v)} className="text-muted-foreground hover:text-foreground transition-colors duration-200" aria-label={hideBalance ? 'Afficher le solde' : 'Masquer le solde'}>
                {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-3xl md:text-5xl font-bold mt-2 tracking-tight font-mono">
              {hideBalance
                ? '••••••'
                : displayCurrency === 'BTC'
                ? `${btcPrice ? (balance / btcPrice).toFixed(6) : '0.000000'} BTC`
                : `${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`}
            </div>
            <div className={`text-sm mt-2 font-medium font-mono ${positive ? 'text-success' : 'text-destructive'}`}>
              {hideBalance ? '••••' : (
                <>{t('todayGain')} {positive ? '+' : ''}${todayGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({positive ? '+' : ''}{todayPct}%)</>
              )}
            </div>
          </div>

          {/* Sparkline — évolution du solde sur 7 jours, visible uniquement sur mobile/tablette (remplacée par le grand graphique ci-dessous sur PC) */}
          <div className="flex md:hidden items-center shrink-0">
            <BalanceSparkline />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <Link to="/dashboard/deposits" className="flex-1">
            <Button className="w-full rounded-2xl gap-2">
              <ArrowDownCircle className="w-4 h-4" /> Déposer
            </Button>
          </Link>
          <Link to="/dashboard/withdrawals" className="flex-1">
            <Button variant="secondary" className="w-full rounded-2xl gap-2">
              <ArrowUpCircle className="w-4 h-4" /> Retirer
            </Button>
          </Link>
          <Link to="/dashboard/portfolio" className="flex-1">
            <Button variant="secondary" className="w-full rounded-2xl gap-2">
              <Clock className="w-4 h-4" /> Historique
            </Button>
          </Link>
        </div>

        {/* Grand graphique de performance — occupe l'espace vacant sur PC, aligné en hauteur avec la colonne latérale */}
        <div className="hidden lg:block mt-6 flex-1 min-h-[220px]">
          <PerformanceChart />
        </div>

        {/* Activité récente — dernière notification, comme sur Binance */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <RecentActivityBanner />
        </div>
      </motion.div>

        {/* Colonne latérale — bots actifs, puis raccourcis (mobile uniquement), puis annonces. Sur PC, les raccourcis restent cachés (lg:hidden) donc seuls bots actifs + annonces se partagent la hauteur */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <ActiveBotsWidget />

          {/* Raccourcis — visibles sur mobile/tablette uniquement (déjà présents dans la sidebar sur PC) */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 lg:hidden">
            {quickActions.map((a) => (
              <Link to={a.to} key={a.label}
                className="rounded-2xl p-4 md:p-5 bg-card border border-border/60 flex flex-col items-center justify-center gap-2.5 transition-colors duration-200 hover:border-primary/40">
                <a.icon className="w-6 h-6 text-primary" strokeWidth={2} />
                <span className="text-xs text-center text-foreground">{a.label}</span>
              </Link>
            ))}
          </div>

          <Announcements compact />
        </div>
      </div>

      {/* Tendances du marché — mini-cartes des plus fortes variations */}
      <MarketMovers prices={prices} />

      {/* Marché + dernières transactions, côte à côte sur PC pour occuper toute la largeur. items-stretch pour que la carte transactions égale la hauteur de la carte marché */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      <div className="lg:col-span-8 rounded-[20px] p-5 md:p-6 bg-card border border-border/60">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-base">Prix crypto en direct</h3>
          <Link to="/dashboard/markets" className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors">
            Voir plus <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <MarketMoodBadge prices={prices} />
        <div className="flex items-center justify-between px-1 py-2 mt-2 text-[11px] text-muted-foreground">
          <span>Nom</span>
          <div className="flex items-center gap-10">
            <span>Dernier prix</span>
            <span>Var. % 24h</span>
          </div>
        </div>
        <div className="divide-y divide-border/40">
          {prices.slice(0, 6).map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-3">
              {c.image && <img src={c.image} alt={c.symbol} className="w-8 h-8 rounded-full" />}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm uppercase">{c.symbol}</div>
                <div className="text-[11px] text-muted-foreground">{c.name}</div>
              </div>
              <div className="text-sm font-medium w-28 text-right">${c.current_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              <div className={`w-20 text-right px-2 py-1 rounded-md text-xs font-semibold ${c.price_change_percentage_24h >= 0 ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                {c.price_change_percentage_24h >= 0 ? '+' : ''}{c.price_change_percentage_24h.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>

        {/* Colonne latérale — dernières transactions, à côté du marché sur PC. h-full pour égaler la hauteur de la carte marché */}
        <div className="lg:col-span-4 h-full">
          <RecentTransactionsFeed />
        </div>
      </div>

      {/* Classement des traders + écarts de prix entre plateformes, côte à côte sur PC */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7"><TradersRanking /></div>
        <div className="lg:col-span-5"><PlatformSpread prices={prices} /></div>
      </div>
    </div>
  );
}


// ================= Trade (Manuel = signaux / Automatique = bots) =================
function TradePage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'automatique' ? 'automatique' : 'manuel');
  const { prices } = useCryptoPrices();
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Trade</h2>
        <p className="text-sm text-muted-foreground">Exécutez des signaux manuellement ou laissez vos bots trader pour vous</p>
      </div>

      {/* Graphique + formulaire d'ordre */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8"><TradingViewChart /></div>
        <div className="lg:col-span-4"><OrderForm initialPair={searchParams.get('pair') || undefined} /></div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-sm">
          <TabsTrigger value="manuel">Manuel</TabsTrigger>
          <TabsTrigger value="automatique">Automatique</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === 'manuel' ? <SignalsPage /> : <BotsPage />}

      {/* Positions, historique, actualités, calendrier, messagerie, alertes */}
      <TradingPanel prices={prices} />
    </div>
  );
}


// ================= Portfolio (Actifs) =================
const PORTFOLIO_PAGE_SIZE = 8;
const DONUT_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(38 92% 50%)', 'hsl(210 80% 60%)', 'hsl(280 65% 65%)', 'hsl(0 72% 51%)'];

function PortfolioPage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { prices } = useCryptoPrices();
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchAll = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    const [{ data: d, error: eD }, { data: w, error: eW }] = await Promise.all([
      supabase.from('deposits').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('withdrawals').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
    ]);
    if (eD || eW) {
      setError((eD || eW)?.message || "Impossible de charger vos actifs pour le moment.");
      setLoading(false);
      return;
    }
    setDeposits(d || []); setWithdrawals(w || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [profile?.id]);
  useEffect(() => { setPage(1); }, [tab, search]);

  const balance = Number(profile?.balance || 0);
  const usdtPrice = prices.find(p => p.id === 'tether');
  const btcPrice = prices.find(p => p.id === 'bitcoin');
  const ethPrice = prices.find(p => p.id === 'ethereum');

  // Transactions = deposits + withdrawals unified
  const transactions = [
    ...deposits.map(d => ({ id: d.id, kind: 'deposit', amount: d.amount, status: d.status, crypto: d.crypto_type, date: d.created_at })),
    ...withdrawals.map(w => ({ id: w.id, kind: 'withdrawal', amount: w.amount, status: w.status, crypto: w.crypto_type, date: w.created_at })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const statusFiltered = transactions.filter(t => tab === 'all' ? true : tab === 'success' ? (t.status === 'approved' || t.status === 'completed') : t.status === tab);
  const filtered = search.trim()
    ? statusFiltered.filter(t => {
        const q = search.trim().toLowerCase();
        return (t.crypto || '').toLowerCase().includes(q) || String(t.amount).includes(q) || t.kind.includes(q);
      })
    : statusFiltered;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PORTFOLIO_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PORTFOLIO_PAGE_SIZE, currentPage * PORTFOLIO_PAGE_SIZE);

  // Totaux et répartition des dépôts par crypto (approuvés/complétés uniquement)
  const successfulDeposits = deposits.filter(d => d.status === 'approved' || d.status === 'completed');
  const totalDeposited = successfulDeposits.reduce((s, d) => s + Number(d.amount || 0), 0);
  const successfulWithdrawals = withdrawals.filter(w => w.status === 'approved' || w.status === 'completed');
  const totalWithdrawn = successfulWithdrawals.reduce((s, w) => s + Number(w.amount || 0), 0);

  const byCrypto = successfulDeposits.reduce((acc: Record<string, number>, d) => {
    const key = (d.crypto_type || 'Autre').toUpperCase();
    acc[key] = (acc[key] || 0) + Number(d.amount || 0);
    return acc;
  }, {});
  const donutData = Object.entries(byCrypto).map(([name, value]) => ({ name, value }));

  const exportCsv = () => {
    const header = 'Type,Montant,Crypto,Statut,Date\n';
    const rows = filtered.map(t =>
      `${t.kind === 'deposit' ? 'Depot' : 'Retrait'},${t.amount},${t.crypto || ''},${t.status},${new Date(t.date).toLocaleDateString('fr-FR')}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `arbiflow-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">Chargement de vos actifs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="w-4 h-4 mr-2" /> Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance + actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-primary/15 via-secondary/60 to-accent/15 border border-primary/20">
        <div className="text-xs md:text-sm text-muted-foreground">Solde disponible (USDT)</div>
        <div className="text-4xl md:text-5xl font-bold text-gradient-gold mt-1">
          ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Gains totaux : <b className="text-success">${Number(profile?.total_earnings || 0).toFixed(2)}</b>
        </div>
        <div className="flex gap-3 mt-5">
          <Button className="btn-gold flex-1 md:flex-none" onClick={() => navigate('/dashboard/deposits')}>
            <ArrowDownCircle className="w-4 h-4 mr-2" /> Dépôt
          </Button>
          <Button variant="outline" className="flex-1 md:flex-none" onClick={() => navigate('/dashboard/withdrawals')}>
            <Send className="w-4 h-4 mr-2" /> Retrait
          </Button>
        </div>
      </motion.div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4">
          <div className="text-[11px] text-muted-foreground">Total déposé</div>
          <div className="font-bold text-success mt-0.5">${totalDeposited.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-[11px] text-muted-foreground">Total retiré</div>
          <div className="font-bold text-destructive mt-0.5">${totalWithdrawn.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-[11px] text-muted-foreground">Net</div>
          <div className="font-bold mt-0.5">${(totalDeposited - totalWithdrawn).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Performance chart */}
      <div className="glass-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold flex items-center gap-2"><LineChart className="w-4 h-4 text-primary" /> Performance</h3>
            <p className="text-xs text-muted-foreground">Évolution du solde et gains quotidiens</p>
          </div>
          <Button size="sm" variant="outline" onClick={async () => {
            const { data } = await supabase.rpc('calculate_daily_returns' as any, { _user_id: profile?.id });
            const rows = (data as any[]) || [];
            const total = rows.reduce((s, r) => s + Number(r.amount_credited || 0), 0);
            toast({ title: 'Rendements crédités', description: total > 0 ? `+$${total.toFixed(2)}` : 'Aucun jour complet écoulé' });
            await refreshProfile();
          }}>💰 Calculer</Button>
        </div>
        <PerformanceChart />
      </div>

      {/* Crypto holdings */}
      <div className="glass-card p-5">
        <h3 className="font-bold mb-3">Cryptos détenues</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
            {usdtPrice?.image && <img src={usdtPrice.image} alt="USDT" className="w-9 h-9 rounded-full" />}
            <div className="flex-1">
              <div className="font-semibold text-sm">Tether</div>
              <div className="text-[11px] text-muted-foreground">USDT</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-sm">{balance.toFixed(2)} USDT</div>
              <div className="text-[11px] text-muted-foreground">${balance.toFixed(2)}</div>
            </div>
          </div>
          {balance > 0 && (btcPrice || ethPrice) && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {btcPrice && (
                <div className="p-2.5 rounded-lg bg-secondary/20 text-center">
                  <div className="text-[10px] text-muted-foreground">Équivalent BTC</div>
                  <div className="text-xs font-semibold mt-0.5">{(balance / btcPrice.current_price).toFixed(6)}</div>
                </div>
              )}
              {ethPrice && (
                <div className="p-2.5 rounded-lg bg-secondary/20 text-center">
                  <div className="text-[10px] text-muted-foreground">Équivalent ETH</div>
                  <div className="text-xs font-semibold mt-0.5">{(balance / ethPrice.current_price).toFixed(5)}</div>
                </div>
              )}
            </div>
          )}
          {balance === 0 && <p className="text-center text-xs text-muted-foreground py-3">Effectuez un dépôt pour voir vos actifs.</p>}
        </div>
      </div>

      {/* Répartition des dépôts par crypto */}
      {donutData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-primary" /> Répartition des dépôts par crypto</h3>
          <div className="h-56">
            <PieResponsiveContainer>
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                </Pie>
                <PieTooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => `$${Number(v).toFixed(2)}`}
                />
                <PieLegend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </PieResponsiveContainer>
          </div>
        </div>
      )}

      {/* Transactions history */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h3 className="font-bold">Historique des transactions</h3>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Exporter
          </Button>
        </div>

        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par crypto ou montant..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/40 border border-border/50 text-sm placeholder:text-muted-foreground input-premium"
          />
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mb-3">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="success">Succès</TabsTrigger>
            <TabsTrigger value="rejected">Rejeté</TabsTrigger>
          </TabsList>
        </Tabs>

        {filtered.length === 0 ? <p className="text-center text-sm text-muted-foreground py-6">Aucune transaction</p> : (
          <>
            <div className="space-y-2">
              {paged.map((t) => (
                <div key={t.kind + t.id} className="p-3 rounded-lg bg-secondary/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${t.kind === 'deposit' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                      {t.kind === 'deposit' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{t.kind === 'deposit' ? 'Dépôt' : 'Retrait'} ${Number(t.amount).toLocaleString()}</div>
                      <div className="text-[11px] text-muted-foreground">{t.crypto} • {new Date(t.date).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
                </Button>
                <span className="text-xs text-muted-foreground">Page {currentPage} / {totalPages}</span>
                <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Suivant <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const c: Record<string, any> = {
    pending: { l: 'En attente', I: Clock, cls: 'bg-warning/20 text-warning' },
    approved: { l: 'Succès', I: CheckCircle2, cls: 'bg-success/20 text-success' },
    completed: { l: 'Succès', I: CheckCircle2, cls: 'bg-success/20 text-success' },
    rejected: { l: 'Rejeté', I: XCircle, cls: 'bg-destructive/20 text-destructive' },
  };
  const x = c[status] || c.pending;
  const I = x.I;
  return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${x.cls}`}><I className="w-3 h-3" />{x.l}</span>;
}

// ================= Deposits =================
function DepositsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('usdttrc20');
  const [loading, setLoading] = useState(false);
  const [payInfo, setPayInfo] = useState<any>(null);
  const [tab, setTab] = useState('all');

  useEffect(() => { if (profile) fetchDep(); }, [profile]);
  const fetchDep = async () => {
    const { data } = await supabase.from('deposits').select('*').eq('user_id', profile?.id).order('created_at', { ascending: false });
    setDeposits(data || []);
  };
  const create = async () => {
    if (!amount || !profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('nowpayments-create', { body: { amount: parseFloat(amount), currency } });
      if (error) throw error;
      setPayInfo(data); fetchDep();
      toast({ title: 'Dépôt créé', description: data.demo ? 'Mode démo' : 'Envoyez la crypto à l\'adresse indiquée' });
    } catch (e: any) { toast({ title: 'Erreur', description: e.message, variant: 'destructive' }); }
    setLoading(false);
  };
  const filtered = deposits.filter(d => tab === 'all' ? true : tab === 'success' ? (d.status === 'approved' || d.status === 'completed') : d.status === tab);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dépôts</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 space-y-4">
          <h3 className="font-bold">Nouveau dépôt crypto</h3>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="usdttrc20">USDT (TRC20)</SelectItem>
              <SelectItem value="usdterc20">USDT (ERC20)</SelectItem>
              <SelectItem value="usdc">USDC (ERC20)</SelectItem>
              <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
              <SelectItem value="eth">Ethereum (ETH)</SelectItem>
              <SelectItem value="bnbbsc">BNB (BSC)</SelectItem>
              <SelectItem value="sol">Solana (SOL)</SelectItem>
            </SelectContent>
          </Select>
          <input type="text" inputMode="decimal" autoComplete="off" placeholder="Montant en USD (min 50)" value={amount}
            onChange={(e) => setAmount(sanitizeDecimalInput(e.target.value))}
            className="w-full px-4 py-3 rounded-lg bg-input border border-border input-premium" />
          <Button className="w-full btn-gold" onClick={create} disabled={loading || !amount || parseFloat(amount) < 50}>
            <ArrowDownCircle className="w-4 h-4 mr-2" />{loading ? 'Génération...' : 'Générer adresse'}
          </Button>
          {payInfo && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 space-y-2 text-sm">
              <div className="font-mono font-bold">{payInfo.pay_amount} {payInfo.pay_currency?.toUpperCase()}</div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-xs break-all bg-background/50 p-2 rounded flex-1">{payInfo.pay_address}</div>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(payInfo.pay_address); toast({ title: 'Copié' }); }}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="glass-card p-5">
          <h3 className="font-bold mb-3">Historique</h3>
          <Tabs value={tab} onValueChange={setTab} className="mb-3">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="pending">En attente</TabsTrigger>
              <TabsTrigger value="success">Succès</TabsTrigger>
              <TabsTrigger value="rejected">Rejeté</TabsTrigger>
            </TabsList>
          </Tabs>
          {filtered.length === 0 ? <p className="text-center text-sm text-muted-foreground py-6">Aucun dépôt</p> : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filtered.map((d) => (
                <div key={d.id} className="p-3 rounded-lg bg-secondary/30 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">${Number(d.amount).toLocaleString()}</div>
                    <div className="text-[11px] text-muted-foreground">{d.crypto_type} • {new Date(d.created_at).toLocaleDateString()}</div>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================= Withdrawals =================
function WithdrawalsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [wallet, setWallet] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [ct, setCt] = useState('USDT-TRC20');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('all');
  const [showKyc, setShowKyc] = useState(false);

  useEffect(() => { if (profile) fetchW(); }, [profile]);
  useEffect(() => { if ((profile as any)?.withdrawal_address) setWallet((profile as any).withdrawal_address); }, [profile?.id]);
  const fetchW = async () => {
    const { data } = await supabase.from('withdrawals').select('*').eq('user_id', profile?.id).order('created_at', { ascending: false });
    setItems(data || []);
  };
  const requiresPwd = !!(profile as any)?.withdrawal_password;
  const walletError = getWalletAddressError(ct, wallet);
  const isWalletValid = validateWalletAddress(ct, wallet);
  const MIN_WITHDRAWAL = 50;
  const kycApproved = (profile as any)?.kyc_status === 'approved';
  const submit = async () => {
    if (!amount || !wallet || !profile) return;
    if (!kycApproved) { setShowKyc(true); return; }
    if (profile.withdrawals_blocked) { toast({ title: 'Retraits bloqués', variant: 'destructive' }); return; }
    if (parseFloat(amount) < MIN_WITHDRAWAL) { toast({ title: 'Montant trop faible', description: `Le retrait minimum est de ${MIN_WITHDRAWAL}$.`, variant: 'destructive' }); return; }
    if (parseFloat(amount) > profile.balance) { toast({ title: 'Solde insuffisant', variant: 'destructive' }); return; }
    if (!isWalletValid) {
      toast({ title: 'Adresse wallet invalide', description: `Vérifiez le format pour ${ct}`, variant: 'destructive' }); return;
    }
    if (!requiresPwd || !pwd.trim()) {
      toast({ title: 'Mot de passe de retrait requis', description: 'Définissez ou saisissez votre mot de passe de retrait.', variant: 'destructive' }); return;
    }
    if (pwd !== (profile as any).withdrawal_password) {
      toast({ title: 'Mot de passe de retrait incorrect', variant: 'destructive' }); return;
    }
    setLoading(true);
    const { error } = await supabase.from('withdrawals').insert({ user_id: profile.id, amount: parseFloat(amount), wallet_address: wallet, crypto_type: ct });
    if (!error) { fetchW(); setAmount(''); setPwd(''); toast({ title: 'Demande envoyée', description: 'En attente de validation admin' }); }
    else toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    setLoading(false);
  };
  const filtered = items.filter(w => tab === 'all' ? true : tab === 'success' ? (w.status === 'approved' || w.status === 'completed') : w.status === tab);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Retraits</h2>
      {profile?.withdrawals_blocked && <div className="p-3 rounded bg-destructive/20 border border-destructive text-destructive text-sm">Retraits bloqués — contactez le support.</div>}
      {!requiresPwd && (
        <div className="p-3 rounded bg-warning/10 border border-warning/30 text-warning text-xs">
          Vous n'avez pas encore défini de mot de passe de retrait. Définissez-en un dans votre <Link to="/dashboard/profile" className="underline font-medium">profil</Link> pour sécuriser vos retraits.
        </div>
      )}
      {showKyc && !kycApproved && (
        <div className="max-w-xl">
          <KYCVerification onApproved={() => setShowKyc(false)} />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 space-y-4">
          <h3 className="font-bold">Nouveau retrait</h3>
          <div className="p-3 rounded bg-secondary/30">
            <div className="text-xs text-muted-foreground">Solde disponible</div>
            <div className="text-xl font-bold text-gradient-gold">${profile?.balance?.toLocaleString() || 0}</div>
          </div>
          <Select value={ct} onValueChange={setCt}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USDT-TRC20">USDT (TRC20)</SelectItem>
              <SelectItem value="USDT-ERC20">USDT (ERC20)</SelectItem>
              <SelectItem value="USDC-ERC20">USDC (ERC20)</SelectItem>
              <SelectItem value="BTC">Bitcoin</SelectItem>
              <SelectItem value="ETH">Ethereum</SelectItem>
              <SelectItem value="BNB">BNB</SelectItem>
              <SelectItem value="SOL">Solana</SelectItem>
            </SelectContent>
          </Select>
          <input type="text" inputMode="decimal" autoComplete="off" placeholder={`Montant USD (min ${MIN_WITHDRAWAL})`} value={amount}
            onChange={(e) => setAmount(sanitizeDecimalInput(e.target.value))}
            className="w-full px-4 py-3 rounded-lg bg-input border border-border input-premium" />
          {amount && parseFloat(amount) < MIN_WITHDRAWAL && (
            <p className="text-xs text-destructive -mt-2">Le retrait minimum est de {MIN_WITHDRAWAL}$.</p>
          )}
          <div>
            <input type="text" autoComplete="off" placeholder="Adresse wallet" value={wallet} onChange={(e) => setWallet(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg bg-input border input-premium ${walletError ? 'border-destructive' : 'border-border'}`} />
            {walletError && <p className="text-xs text-destructive mt-1">{walletError}</p>}
          </div>
          {requiresPwd ? (
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} autoComplete="off" placeholder="Mot de passe de retrait" value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-lg bg-input border border-border input-premium" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <div className="p-3 rounded bg-warning/10 border border-warning/30 text-warning text-xs">
              Un mot de passe de retrait est obligatoire. Définissez-en un dans votre <Link to="/dashboard/profile" className="underline font-medium">profil</Link> avant de continuer.
            </div>
          )}
          <Button className="w-full btn-gold" onClick={submit}
            disabled={loading || !amount || parseFloat(amount) < MIN_WITHDRAWAL || !wallet || !isWalletValid || !requiresPwd || !pwd || profile?.withdrawals_blocked}>
            <ArrowUpCircle className="w-4 h-4 mr-2" />{loading ? '...' : 'Demander'}
          </Button>
        </div>
        <div className="glass-card p-5">
          <h3 className="font-bold mb-3">Historique</h3>
          <Tabs value={tab} onValueChange={setTab} className="mb-3">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="pending">En attente</TabsTrigger>
              <TabsTrigger value="success">Succès</TabsTrigger>
              <TabsTrigger value="rejected">Rejeté</TabsTrigger>
            </TabsList>
          </Tabs>
          {filtered.length === 0 ? <p className="text-center text-sm text-muted-foreground py-6">Aucun retrait</p> : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filtered.map((w) => (
                <div key={w.id} className="p-3 rounded-lg bg-secondary/30 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">${Number(w.amount).toLocaleString()}</div>
                    <div className="text-[11px] text-muted-foreground">{w.crypto_type} • {new Date(w.created_at).toLocaleDateString()}</div>
                  </div>
                  <StatusBadge status={w.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================= Network (Referrals) =================
function NetworkPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [refs, setRefs] = useState<any[]>([]);
  const [totalBonus, setTotalBonus] = useState(0);
  useEffect(() => {
    if (profile) supabase.rpc('get_my_referrals').then(({ data }) => setRefs(data || []));
  }, [profile]);
  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from('referral_earnings' as any)
      .select('bonus_amount')
      .eq('referrer_id', profile.id)
      .then(({ data }) => setTotalBonus(((data as any) || []).reduce((sum: number, r: any) => sum + Number(r.bonus_amount), 0)));
  }, [profile?.id]);
  const link = `${window.location.origin}/register?ref=${profile?.referral_code}`;
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">Réseau — Parrainage</h2>
      <div className="glass-card p-5">
        <p className="text-sm text-muted-foreground mb-3">Gagnez 10% du montant de chaque dépôt effectué par vos filleuls</p>
        <div className="flex flex-col md:flex-row gap-2">
          <input value={link} readOnly className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-sm" />
          <Button variant="outline" onClick={() => { navigator.clipboard.writeText(link); toast({ title: 'Copié !' }); }}>
            <Copy className="w-4 h-4 mr-2" />Copier
          </Button>
        </div>
        <p className="text-sm mt-2">Code : <span className="font-mono text-primary">{profile?.referral_code}</span></p>
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total gagné en bonus de parrainage</span>
          <span className="text-sm font-semibold text-success">+${totalBonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      <div className="glass-card p-5">
        <h3 className="font-bold mb-3">Mes filleuls ({refs.length})</h3>
        {refs.length === 0 ? <p className="text-muted-foreground text-center py-6 text-sm">Aucun filleul</p> : (
          <div className="space-y-2">
            {refs.map(r => (
              <div key={r.id} className="p-3 rounded bg-secondary/30 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{r.full_name || r.email}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Inscrit le {new Date(r.created_at).toLocaleDateString()}
                    {r.is_blocked && <span className="ml-2 text-destructive font-medium">• Bloqué</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-medium">${Number(r.balance || 0).toLocaleString()}</div>
                  <div className="text-[11px] text-success">+${Number(r.total_earnings || 0).toLocaleString()} gagnés</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ================= Profile (Settings) =================
function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage, theme, setTheme } = useLanguage();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [withdrawPwd, setWithdrawPwd] = useState('');
  const [withdrawAddr, setWithdrawAddr] = useState((profile as any)?.withdrawal_address || '');
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setPhone(profile?.phone || '');
    setWithdrawAddr((profile as any)?.withdrawal_address || '');
  }, [profile?.id]);

  const save = async () => {
    if (!profile) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', profile.id);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { await refreshProfile(); toast({ title: 'Profil mis à jour' }); }
    setLoading(false);
  };
  const pwd = async () => {
    if (newPassword.length < 6) { toast({ title: 'Trop court', variant: 'destructive' }); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Mot de passe modifié' }); setNewPassword(''); }
    setLoading(false);
  };
  const saveWithdrawSecurity = async () => {
    if (!profile) return;
    if (withdrawPwd && withdrawPwd.length < 4) { toast({ title: 'Mot de passe de retrait trop court', variant: 'destructive' }); return; }
    setLoading(true);
    const payload: any = { withdrawal_address: withdrawAddr };
    if (withdrawPwd) payload.withdrawal_password = withdrawPwd;
    const { error } = await supabase.from('profiles').update(payload).eq('id', profile.id);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { await refreshProfile(); setWithdrawPwd(''); toast({ title: 'Sécurité des retraits mise à jour' }); }
    setLoading(false);
  };

  const uploadAvatar = async (file: File) => {
    if (!profile || !user) return;
    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      const { error: dbErr } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
      if (dbErr) throw dbErr;
      await refreshProfile();
      toast({ title: 'Photo de profil mise à jour' });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
    setAvatarUploading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Profil</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 space-y-3">
          <h3 className="font-bold">Informations</h3>
          <div className="flex items-center gap-4 pb-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xl overflow-hidden">
                {(profile as any)?.avatar_url ? (
                  <img src={(profile as any).avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (profile?.full_name?.charAt(0) || 'U')}
              </div>
              <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center cursor-pointer">
                <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              </label>
            </div>
            <div className="text-xs text-muted-foreground">{avatarUploading ? 'Envoi en cours...' : 'Cliquez sur l\'icône pour changer votre photo'}</div>
          </div>
          <input value={user?.email || ''} disabled className="w-full px-4 py-3 rounded-lg bg-input border border-border opacity-50" />
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nom complet" autoComplete="off"
            className="w-full px-4 py-3 rounded-lg bg-input border border-border input-premium" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone" autoComplete="off"
            className="w-full px-4 py-3 rounded-lg bg-input border border-border input-premium" />
          <Button className="w-full btn-gold" onClick={save} disabled={loading}>Mettre à jour</Button>
        </div>
        <div className="glass-card p-5 space-y-3">
          <h3 className="font-bold">Sécurité du compte</h3>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nouveau mot de passe" autoComplete="new-password"
            className="w-full px-4 py-3 rounded-lg bg-input border border-border input-premium" />
          <Button className="w-full" onClick={pwd} disabled={loading || !newPassword}>Modifier le mot de passe</Button>
        </div>
        <div className="glass-card p-5 space-y-3 lg:col-span-2">
          <h3 className="font-bold flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary" /> Sécurité des retraits</h3>
          <p className="text-xs text-muted-foreground">Définissez un mot de passe de retrait et une adresse wallet par défaut pour sécuriser vos demandes de retrait.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="password" value={withdrawPwd} onChange={(e) => setWithdrawPwd(e.target.value)}
              placeholder={(profile as any)?.withdrawal_password ? 'Modifier le mot de passe de retrait' : 'Définir un mot de passe de retrait'}
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-lg bg-input border border-border input-premium" />
            <input type="text" value={withdrawAddr} onChange={(e) => setWithdrawAddr(e.target.value)} placeholder="Adresse wallet de retrait par défaut" autoComplete="off"
              className="w-full px-4 py-3 rounded-lg bg-input border border-border input-premium" />
          </div>
          <Button className="w-full md:w-auto btn-gold" onClick={saveWithdrawSecurity} disabled={loading}>Enregistrer</Button>
        </div>
        <div className="glass-card p-5 space-y-3">
          <h3 className="font-bold">Préférences</h3>
          <Select value={language} onValueChange={(l) => { setLanguage(l as any); toast({ title: 'Langue enregistrée' }); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">🇫🇷 Français</SelectItem>
              <SelectItem value="en">🇬🇧 English</SelectItem>
              <SelectItem value="es">🇪🇸 Español</SelectItem>
              <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
              <SelectItem value="it">🇮🇹 Italiano</SelectItem>
              <SelectItem value="pt">🇵🇹 Português</SelectItem>
            </SelectContent>
          </Select>
          <Select value={theme} onValueChange={(t) => { setTheme(t as any); toast({ title: t === 'light' ? 'Thème clair activé' : 'Thème sombre activé' }); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">🌙 Sombre</SelectItem>
              <SelectItem value="light">☀️ Clair</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="glass-card p-5 space-y-2 text-sm">
          <h3 className="font-bold">Compte</h3>
          <div className="flex justify-between"><span className="text-muted-foreground">Code parrainage</span><span className="font-mono text-primary">{profile?.referral_code}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Membre depuis</span><span>{profile?.created_at && new Date(profile.created_at).toLocaleDateString()}</span></div>
        </div>
      </div>
    </div>
  );
}

// ================= Support =================
function SupportPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (profile) supabase.from('support_tickets').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).then(({ data }) => setTickets(data || [])); }, [profile]);
  const submit = async () => {
    if (!subject || !message || !profile) return;
    setLoading(true);
    await supabase.from('support_tickets').insert({ user_id: profile.id, subject, message });
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', profile.id).order('created_at', { ascending: false });
    setTickets(data || []); setSubject(''); setMessage('');
    toast({ title: 'Ticket envoyé' }); setLoading(false);
  };
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">Support</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 space-y-3">
          <input placeholder="Sujet" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-input border border-border input-premium" />
          <textarea placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-input border border-border input-premium h-32 resize-none" />
          <Button className="w-full btn-gold" onClick={submit} disabled={loading || !subject || !message}><MessageCircle className="w-4 h-4 mr-2" />Envoyer</Button>
        </div>
        <div className="glass-card p-5">
          <h3 className="font-bold mb-3">Mes tickets</h3>
          {tickets.length === 0 ? <p className="text-muted-foreground text-center py-6 text-sm">Aucun ticket</p> : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tickets.map(t => (
                <div key={t.id} className="p-3 rounded bg-secondary/30">
                  <div className="flex justify-between mb-1"><span className="font-medium text-sm">{t.subject}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${t.status === 'closed' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>{t.status === 'closed' ? 'Fermé' : 'Ouvert'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.message}</p>
                  {t.admin_response && <div className="mt-2 p-2 rounded bg-primary/10 border-l-2 border-primary text-xs"><b className="text-primary">Admin :</b> {t.admin_response}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================= Main =================
export default function Dashboard() {
  const { profile, signOut, isAdmin } = useAuth();
  const { t, language, setLanguage, theme, setTheme } = useLanguage();
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showInstallApp, setShowInstallApp] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  const submitHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = headerSearch.trim();
    navigate(q ? `/dashboard/markets?q=${encodeURIComponent(q)}` : '/dashboard/markets');
  };

  // Popup du tutoriel à l'inscription, popup des annonces à la connexion, puis
  // popup d'installation de l'application (une fois les deux précédentes
  // refermées, pour ne jamais empiler plusieurs popups à l'écran).
  //
  // IMPORTANT : on ne se base plus sur un flag sessionStorage posé
  // uniquement par Login.tsx/Register.tsx (chemin mot de passe), car la
  // connexion/inscription via Google (signInWithOAuth) redirige directement
  // vers /dashboard sans jamais exécuter ce code, ce qui empêchait le popup
  // de s'afficher pour ces utilisateurs. On se base désormais directement
  // sur le profil chargé (fonctionne quel que soit le mode d'authentification,
  // et sur tout type d'appareil : mobile, tablette, desktop).
  useEffect(() => {
    if (!profile) return;

    const alreadyHandled = sessionStorage.getItem('sx_popup_handled') === '1';
    if (alreadyHandled) return;

    // Compte créé il y a moins de 3 minutes -> on considère qu'il s'agit
    // d'une inscription fraîche, on montre le tutoriel plutôt que les annonces.
    const createdAt = profile.created_at ? new Date(profile.created_at).getTime() : 0;
    const isFreshSignup = createdAt > 0 && Date.now() - createdAt < 3 * 60 * 1000;

    sessionStorage.setItem('sx_popup_handled', '1');

    if (isFreshSignup) {
      setShowTutorial(true);
    } else if (!profile.hide_announcements_popup) {
      setShowAnnouncements(true);
    } else {
      // Ni tutoriel ni annonces à montrer : on affiche directement la popup
      // d'installation après un court délai (post connexion/inscription).
      setTimeout(() => setShowInstallApp(true), 600);
    }
  }, [profile]);

  const sideGroups = [
    {
      label: 'Menu principal',
      collapsible: false,
      items: [
        { path: '/dashboard', icon: LayoutDashboard, label: t('home') },
        { path: '/dashboard/markets', icon: BarChart3, label: t('markets') },
        { path: '/dashboard/trade', icon: Zap, label: t('trader') },
        { path: '/dashboard/strategy', icon: Layers, label: t('strategies'), isNew: true },
      ],
    },
    {
      label: 'Portefeuille',
      collapsible: true,
      items: [
        { path: '/dashboard/portfolio', icon: Wallet, label: t('assets') },
        { path: '/dashboard/deposits', icon: ArrowDownCircle, label: t('deposits') },
        { path: '/dashboard/withdrawals', icon: ArrowUpCircle, label: t('withdrawals') },
        { path: '/dashboard/network', icon: Users, label: t('network') },
      ],
    },
    {
      label: 'Compte',
      collapsible: true,
      items: [
        { path: '/dashboard/announcements', icon: Megaphone, label: t('announcements') },
        { path: '/dashboard/profile', icon: User, label: t('profile') },
        { path: '/dashboard/support', icon: MessageCircle, label: t('support') },
        ...(isAdmin ? [{ path: '/admin', icon: ShieldCheck, label: t('adminSpace') }] : []),
      ],
    },
  ];

  const signOutN = async () => { await signOut(); navigate('/'); };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — visible en permanence sur desktop, absente sur mobile (navigation via la barre basse) */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col h-full">
          <div className="px-5 py-5 border-b border-sidebar-border">
            <NavLink to="/" className="flex items-center gap-2">
              <img src="/images/logo/logo.svg" alt="logo" className="h-6 w-auto" />
              <span className="text-base font-bold text-white">ArbiFlow</span>
            </NavLink>
          </div>
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {sideGroups.map((group, gi) => (
              group.collapsible ? (
                <Accordion key={group.label} type="single" collapsible defaultValue={group.label} className="border-none">
                  <AccordionItem value={group.label} className="border-none">
                    <AccordionTrigger className="sidebar-section-label hover:no-underline py-2 [&>svg]:w-3.5 [&>svg]:h-3.5">
                      {group.label}
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      {group.items.map(i => (
                        <NavLink key={i.path} to={i.path} end={i.path === '/dashboard'}
                          className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-200 ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`}>
                          <i.icon className="w-4 h-4" strokeWidth={2} /><span className="flex-1">{i.label}</span>
                          {(i as any).isNew && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">New</span>}
                        </NavLink>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <div key={group.label}>
                  <div className="sidebar-section-label pt-0">{group.label}</div>
                  {group.items.map(i => (
                    <NavLink key={i.path} to={i.path} end={i.path === '/dashboard'}
                      className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-200 ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`}>
                      <i.icon className="w-4 h-4" strokeWidth={2} /><span className="flex-1">{i.label}</span>
                      {(i as any).isNew && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">New</span>}
                    </NavLink>
                  ))}
                </div>
              )
            ))}
          </nav>
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">{profile?.full_name?.charAt(0) || 'U'}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-sm">{profile?.full_name || 'Trader'}</div>
                <div className="text-[11px] text-muted-foreground truncate">{profile?.email}</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={signOutN}>
              <LogOut className="w-4 h-4 mr-2" />{t('logout')}
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-h-screen w-full">
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border">
          {/* Ligne 1 : logo (mobile) + icônes — sur desktop, se confond avec la barre de recherche sur une seule ligne */}
          <div className="flex items-center gap-3 px-4 md:px-6 h-14 lg:h-16">
            <NavLink to="/" className="lg:hidden flex items-center gap-2">
              <img src="/images/logo/logo.svg" alt="logo" className="h-6 w-auto" />
              <span className="font-bold text-white text-sm">ArbiFlow</span>
            </NavLink>

            {/* Barre de recherche — visible en ligne sur desktop uniquement */}
            <form onSubmit={submitHeaderSearch} className="hidden lg:flex items-center relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" strokeWidth={2} />
              <input
                type="search"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder="Rechercher des cryptos, produits..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/40 border border-border/50 text-sm placeholder:text-muted-foreground input-premium"
              />
            </form>

            <div className="flex items-center gap-1 ml-auto">
              <button className="p-2 rounded-full hover:bg-secondary/60 transition-colors duration-200 w-9 h-9 flex items-center justify-center text-muted-foreground">
                <ScanLine className="w-[18px] h-[18px]" strokeWidth={2} />
              </button>

              <NotificationBell />

              {/* Profil */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-0.5 rounded-full hover:bg-secondary/60 transition-colors duration-200 ml-0.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xs">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-semibold text-sm">{profile?.full_name || 'Utilisateur'}</div>
                    <div className="text-xs text-muted-foreground font-normal">{profile?.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/dashboard/profile"><User className="w-4 h-4 mr-2" /> {t('profile')}</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/dashboard/portfolio"><Wallet className="w-4 h-4 mr-2" /> {t('assets')}</Link></DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setWatchlistOpen(true)}><Star className="w-4 h-4 mr-2" /> Watchlist</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />} {theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAppearanceOpen(true)}><Settings className="w-4 h-4 mr-2" /> Paramètres</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/dashboard/support"><HelpCircle className="w-4 h-4 mr-2" /> {t('support')}</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOutN} className="text-destructive focus:text-destructive"><LogOut className="w-4 h-4 mr-2" /> {t('logout')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Ligne 2 : barre de recherche pleine largeur — mobile uniquement */}
          <form onSubmit={submitHeaderSearch} className="lg:hidden px-4 pb-3">
            <div className="flex items-center relative">
              <Search className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" strokeWidth={2} />
              <input
                type="search"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder="Rechercher des cryptos, produits..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm placeholder:text-muted-foreground input-premium"
              />
            </div>
          </form>
        </header>

        <WatchlistSheet open={watchlistOpen} onOpenChange={setWatchlistOpen} />
        <AppearanceSheet open={appearanceOpen} onOpenChange={setAppearanceOpen} />

        <div className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/markets" element={<MarketsPage />} />
            <Route path="/trade" element={<TradePage />} />
            <Route path="/trader" element={<TradePage />} />
            <Route path="/bots/:id" element={<BotDetailPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/strategy" element={<StrategyPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/signals" element={<SignalsPage />} />
            <Route path="/deposits" element={<DepositsPage />} />
            <Route path="/withdrawals" element={<WithdrawalsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<ProfilePage />} />
            <Route path="/investments" element={<PortfolioPage />} />
            <Route path="/referrals" element={<NetworkPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Routes>
        </div>
      </main>

      <BottomNav />

      <TutorialDialog
        open={showTutorial}
        onClose={() => { setShowTutorial(false); setTimeout(() => setShowInstallApp(true), 400); }}
      />
      <AnnouncementsDialog
        open={showAnnouncements}
        onClose={() => { setShowAnnouncements(false); setTimeout(() => setShowInstallApp(true), 400); }}
      />
      <InstallAppPopup open={showInstallApp} onClose={() => setShowInstallApp(false)} />
      <SupportChatWidget />
    </div>
  );
}
