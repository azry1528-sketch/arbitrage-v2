import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCryptoPrices, CryptoPrice } from '@/hooks/useCryptoPrices';
import { useFavorites } from '@/hooks/useFavorites';
import {
  TrendingUp, TrendingDown, X, Loader2, Search, Star, LineChart, Zap,
  ChevronRight, ArrowUpDown, ChevronUp, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Period = '1h' | '24h' | '7d';
type SortKey = 'market_cap' | 'current_price' | 'change' | 'total_volume';
type MainTab = 'favoris' | 'tout' | 'hausses' | 'baisses' | 'volume';

const STABLECOIN_SYMBOLS = ['usdt', 'usdc', 'dai', 'busd', 'tusd', 'fdusd', 'usde'];

function getChange(c: CryptoPrice, period: Period): number {
  if (period === '1h') return c.price_change_percentage_1h_in_currency ?? c.price_change_percentage_24h;
  if (period === '7d') return c.price_change_percentage_7d_in_currency ?? c.price_change_percentage_24h;
  return c.price_change_percentage_24h;
}

export default function MarketsPage() {
  const { prices, loading } = useCryptoPrices();
  const { isFavorite, toggleFavorite, favorites } = useFavorites();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<CryptoPrice | null>(null);
  const [search, setSearch] = useState(searchParams.get('q') || '');

  // Si on arrive depuis la barre de recherche du header avec un nouveau ?q=..., on le reprend
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q !== search) setSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const [tab, setTab] = useState<MainTab>('tout');
  const [chip, setChip] = useState<'tout' | 'top10' | 'stable'>('tout');
  const [period, setPeriod] = useState<Period>('24h');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'market_cap', dir: 'desc' });

  // ----- Mini-cartes "tendances du marché" -----
  const popular = useMemo(() => [...prices].sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0)).slice(0, 3), [prices]);
  const smallCaps = useMemo(() => [...prices].filter((p) => p.market_cap).sort((a, b) => (a.market_cap || 0) - (b.market_cap || 0)).slice(0, 3), [prices]);
  const topGainers = useMemo(() => [...prices].sort((a, b) => getChange(b, period) - getChange(a, period)).slice(0, 3), [prices, period]);
  const topVolume = useMemo(() => [...prices].sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0)).slice(0, 3), [prices]);

  // ----- Filtrage + tri du tableau principal -----
  const filtered = useMemo(() => {
    let rows = [...prices];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
    }

    if (chip === 'top10') rows = rows.slice(0, 10);
    if (chip === 'stable') rows = rows.filter((c) => STABLECOIN_SYMBOLS.includes(c.symbol.toLowerCase()));

    if (tab === 'favoris') rows = rows.filter((c) => isFavorite(c.id));
    if (tab === 'hausses') rows = rows.filter((c) => getChange(c, period) >= 0).sort((a, b) => getChange(b, period) - getChange(a, period));
    if (tab === 'baisses') rows = rows.filter((c) => getChange(c, period) < 0).sort((a, b) => getChange(a, period) - getChange(b, period));
    if (tab === 'volume') rows = rows.sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));

    if (tab === 'tout' || tab === 'favoris') {
      rows.sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1;
        if (sort.key === 'market_cap') return dir * ((a.market_cap || 0) - (b.market_cap || 0));
        if (sort.key === 'current_price') return dir * (a.current_price - b.current_price);
        if (sort.key === 'total_volume') return dir * ((a.total_volume || 0) - (b.total_volume || 0));
        return dir * (getChange(a, period) - getChange(b, period));
      });
    }

    return rows;
  }, [prices, search, chip, tab, sort, period, isFavorite]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
  };

  const jumpTo = (nextTab: MainTab) => { setTab(nextTab); window.scrollTo({ top: 400, behavior: 'smooth' }); };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Marchés</h2>
        <p className="text-sm text-muted-foreground">Prix crypto en temps réel • Cliquez sur un actif pour le détail</p>
      </div>

      {/* Barre de recherche */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une crypto..."
          className="pl-9 rounded-xl"
        />
      </div>

      {/* 4 mini-cartes de tendances */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MoverCard title="Populaire" items={popular} onMore={() => jumpTo('tout')} />
        <MoverCard title="Petites caps" items={smallCaps} onMore={() => jumpTo('tout')} />
        <MoverCard title="Le + en hausse" items={topGainers} period={period} onMore={() => jumpTo('hausses')} />
        <MoverCard title="Meilleur volume" items={topVolume} showVolume onMore={() => jumpTo('volume')} />
      </div>

      {/* Onglets principaux */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {([
          { key: 'favoris', label: `Favoris${favorites.length ? ` (${favorites.length})` : ''}` },
          { key: 'tout', label: 'Toutes les cryptos' },
          { key: 'hausses', label: 'Plus fortes hausses' },
          { key: 'baisses', label: 'Plus fortes baisses' },
          { key: 'volume', label: 'Volume' },
        ] as { key: MainTab; label: string }[]).map((tItem) => (
          <button
            key={tItem.key}
            onClick={() => setTab(tItem.key)}
            className={`px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-200 ${
              tab === tItem.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tItem.label}
          </button>
        ))}
      </div>

      {/* Chips de filtre secondaire */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {([
          { key: 'tout', label: 'Tout' },
          { key: 'top10', label: 'Top 10' },
          { key: 'stable', label: 'Stablecoins' },
        ] as { key: typeof chip; label: string }[]).map((c) => (
          <button
            key={c.key}
            onClick={() => setChip(c.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-200 ${
              chip === c.key ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary/50 text-muted-foreground border border-transparent hover:bg-secondary'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Tableau principal */}
      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-3 text-xs uppercase text-muted-foreground border-b border-border items-center gap-2">
          <div className="col-span-4 md:col-span-3">Nom</div>
          <SortableHead className="col-span-2 text-right hidden md:block" active={sort.key === 'current_price'} dir={sort.dir} onClick={() => toggleSort('current_price')}>Prix</SortableHead>
          <div className="col-span-1 hidden lg:block" />
          <div className="col-span-4 md:col-span-2 flex items-center justify-end">
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="h-6 w-auto gap-1 border-none bg-transparent px-0 py-0 text-xs uppercase text-muted-foreground hover:text-foreground justify-end">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="1h">1 h</SelectItem>
                <SelectItem value="24h">24 h</SelectItem>
                <SelectItem value="7d">7 j</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <SortableHead className="col-span-3 md:col-span-2 text-right hidden md:flex" active={sort.key === 'total_volume'} dir={sort.dir} onClick={() => toggleSort('total_volume')}>Volume 24h</SortableHead>
          <SortableHead className="col-span-2 text-right hidden lg:flex" active={sort.key === 'market_cap'} dir={sort.dir} onClick={() => toggleSort('market_cap')}>Capitalisation</SortableHead>
          <div className="col-span-4 md:col-span-1 text-right">Actions</div>
        </div>

        {loading && <div className="p-8 text-center text-muted-foreground text-sm">Chargement...</div>}
        {!loading && filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {tab === 'favoris' ? 'Aucun favori pour le moment — cliquez sur l\'étoile d\'une crypto pour l\'ajouter.' : 'Aucun résultat.'}
          </div>
        )}

        {filtered.map((c, i) => {
          const change = getChange(c, period);
          const positive = change >= 0;
          const fav = isFavorite(c.id);
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 20) * 0.015 }}
              className="grid grid-cols-12 px-4 py-3 items-center border-b border-border/50 hover:bg-secondary/30 transition-colors duration-200 gap-2"
            >
              <div className="col-span-4 md:col-span-3 flex items-center gap-2.5 min-w-0">
                <button onClick={() => toggleFavorite(c.id)} className="shrink-0 text-muted-foreground hover:text-amber-400 transition-colors duration-200">
                  <Star className={`w-4 h-4 ${fav ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
                {c.image && <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full shrink-0" />}
                <button onClick={() => setSelected(c)} className="text-left min-w-0">
                  <div className="font-semibold text-sm truncate">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground uppercase">{c.symbol}</div>
                </button>
              </div>

              <button onClick={() => setSelected(c)} className="col-span-2 text-right font-medium text-sm hidden md:block">
                ${c.current_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}
              </button>

              <div className="col-span-1 hidden lg:flex items-center justify-center">
                <MiniSparkline data={c.sparkline_in_7d?.price} positive={positive} />
              </div>

              <div className={`col-span-4 md:col-span-2 text-right text-sm font-semibold flex items-center justify-end gap-1 ${positive ? 'text-success' : 'text-destructive'}`}>
                {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(change).toFixed(2)}%
              </div>

              <div className="col-span-3 md:col-span-2 text-right text-sm text-muted-foreground hidden md:block">
                {c.total_volume ? `$${(c.total_volume / 1e6).toFixed(1)}M` : '—'}
              </div>

              <div className="col-span-2 text-right text-sm text-muted-foreground hidden lg:block">
                {c.market_cap ? `$${(c.market_cap / 1e9).toFixed(2)}B` : '—'}
              </div>

              <div className="col-span-4 md:col-span-1 flex items-center justify-end gap-1">
                <button onClick={() => setSelected(c)} title="Voir le graphique" className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-200">
                  <LineChart className="w-4 h-4" />
                </button>
                <Link to={`/dashboard/trade?pair=${c.symbol.toUpperCase()}/USDT`} title="Trader" className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-200">
                  <Zap className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <TokenDetail
            token={selected}
            isFav={isFavorite(selected.id)}
            onToggleFav={() => toggleFavorite(selected.id)}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SortableHead({ className, active, dir, onClick, children }: { className: string; active: boolean; dir: 'asc' | 'desc'; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`${className} items-center justify-end gap-1 text-muted-foreground hover:text-foreground transition-colors duration-200`}>
      {children}
      {active ? (dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
    </button>
  );
}

function MiniSparkline({ data, positive }: { data?: number[]; positive: boolean }) {
  if (!data || data.length < 2) return <div className="w-16 h-6" />;
  const chartData = data.filter((_, i) => i % 4 === 0).map((v) => ({ v }));
  const color = positive ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
  return (
    <div className="w-16 h-6">
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MoverCard({ title, items, onMore, period, showVolume }: { title: string; items: CryptoPrice[]; onMore: () => void; period?: Period; showVolume?: boolean }) {
  return (
    <div className="rounded-2xl p-4 bg-card border border-border/60">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-muted-foreground">{title}</h4>
        <button onClick={onMore} className="flex items-center text-[11px] text-muted-foreground hover:text-primary transition-colors duration-200">
          Plus <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-2">
        {items.map((c) => {
          const change = period ? getChange(c, period) : c.price_change_percentage_24h;
          const positive = change >= 0;
          return (
            <div key={c.id} className="flex items-center gap-2 text-sm">
              {c.image && <img src={c.image} alt={c.symbol} className="w-5 h-5 rounded-full shrink-0" />}
              <span className="font-medium uppercase text-xs flex-1 truncate">{c.symbol}</span>
              {showVolume ? (
                <span className="text-xs text-muted-foreground">{c.total_volume ? `$${(c.total_volume / 1e6).toFixed(0)}M` : '—'}</span>
              ) : (
                <span className={`text-xs font-semibold ${positive ? 'text-success' : 'text-destructive'}`}>
                  {positive ? '+' : ''}{change.toFixed(2)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TokenDetail({ token, onClose, isFav, onToggleFav }: { token: CryptoPrice; onClose: () => void; isFav: boolean; onToggleFav: () => void }) {
  const [history, setHistory] = useState<{ time: string; price: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'1' | '7' | '30'>('7');
  const positive = token.price_change_percentage_24h >= 0;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`https://api.coingecko.com/api/v3/coins/${token.id}/market_chart?vs_currency=usd&days=${range}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const prices: [number, number][] = data.prices || [];
        const step = Math.max(1, Math.floor(prices.length / 60));
        const sampled = prices.filter((_, i) => i % step === 0).map(([ts, price]) => ({
          time: new Date(ts).toLocaleDateString('fr-FR', range === '1' ? { hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: '2-digit' }),
          price,
        }));
        setHistory(sampled);
      })
      .catch(() => setHistory([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [token.id, range]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button className="absolute right-4 top-4 text-muted-foreground hover:text-foreground" onClick={onClose}><X className="w-5 h-5" /></button>

        <div className="flex items-center gap-3 mb-4">
          {token.image && <img src={token.image} alt="" className="w-12 h-12 rounded-full" />}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold">{token.name}</h3>
              <button onClick={onToggleFav} className="text-muted-foreground hover:text-amber-400 transition-colors duration-200">
                <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground uppercase">{token.symbol}/USDT</p>
          </div>
          <Link to={`/dashboard/trade?pair=${token.symbol.toUpperCase()}/USDT`}>
            <button className="btn-gold px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Trader
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-secondary/40">
            <div className="text-[11px] text-muted-foreground uppercase">Prix</div>
            <div className="font-bold">${token.current_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/40">
            <div className="text-[11px] text-muted-foreground uppercase">Var. 24h</div>
            <div className={`font-bold ${positive ? 'text-success' : 'text-destructive'}`}>
              {positive ? '+' : ''}{token.price_change_percentage_24h.toFixed(2)}%
            </div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/40">
            <div className="text-[11px] text-muted-foreground uppercase">Volume 24h</div>
            <div className="font-bold">{token.total_volume ? `$${(token.total_volume / 1e6).toFixed(1)}M` : '—'}</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/40">
            <div className="text-[11px] text-muted-foreground uppercase">Cap. marché</div>
            <div className="font-bold">{token.market_cap ? `$${(token.market_cap / 1e9).toFixed(2)}B` : '—'}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          {(['1', '7', '30'] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${range === r ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>
              {r === '1' ? '24h' : r === '7' ? '7j' : '30j'}
            </button>
          ))}
        </div>

        <div className="h-64 -ml-2">
          {loading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement du graphique...
            </div>
          ) : history.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Graphique indisponible</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={positive ? 'hsl(142 76% 36%)' : 'hsl(0 72% 51%)'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={positive ? 'hsl(142 76% 36%)' : 'hsl(0 72% 51%)'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} width={60}
                  tickFormatter={(v) => `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString(undefined, { maximumFractionDigits: 6 })}`, 'Prix']} />
                <Area type="monotone" dataKey="price" stroke={positive ? 'hsl(142 76% 36%)' : 'hsl(0 72% 51%)'} fill="url(#tokenGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
