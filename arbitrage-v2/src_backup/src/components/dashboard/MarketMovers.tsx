import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Star } from 'lucide-react';
import { CryptoPrice } from '@/hooks/useCryptoPrices';
import { useFavorites } from '@/hooks/useFavorites';

type TabKey = 'populaire' | 'hausses' | 'baisses' | 'volume' | 'favori';
type SortKey = 'name' | 'price' | 'change' | 'volume';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'populaire', label: 'Populaire' },
  { key: 'hausses', label: 'Plus fortes hausses' },
  { key: 'baisses', label: 'Plus fortes baisses' },
  { key: 'volume', label: 'Volume sur 24 h' },
  { key: 'favori', label: 'Favori' },
];

function fmtPrice(n: number) {
  const digits = n >= 1 ? 2 : n >= 0.01 ? 4 : 6;
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: digits })} $`;
}

function fmtVolume(n?: number) {
  if (!n) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} Md $`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} M $`;
  return `${Math.round(n).toLocaleString()} $`;
}

// Tableau de marché façon Binance : onglets, colonnes triables, lignes denses,
// variation en pastille verte/rouge et lien « Trader » sur chaque ligne.
export function MarketMovers({ prices, limit = 8 }: { prices: CryptoPrice[]; limit?: number }) {
  const [tab, setTab] = useState<TabKey>('populaire');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' } | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  const rows = useMemo(() => {
    let list = [...prices];
    if (tab === 'hausses') list.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    if (tab === 'baisses') list.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
    if (tab === 'volume') list.sort((a, b) => (b.total_volume ?? 0) - (a.total_volume ?? 0));
    if (tab === 'favori') list = list.filter((c) => isFavorite(c.id));
    if (sort) {
      const val = (c: CryptoPrice) =>
        sort.key === 'name' ? c.symbol : sort.key === 'price' ? c.current_price : sort.key === 'change' ? c.price_change_percentage_24h : c.total_volume ?? 0;
      list.sort((a, b) => {
        const va = val(a), vb = val(b);
        const r = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
        return sort.dir === 'asc' ? r : -r;
      });
    }
    return list.slice(0, limit);
  }, [prices, tab, sort, isFavorite, limit]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (!s || s.key !== key ? { key, dir: 'desc' } : s.dir === 'desc' ? { key, dir: 'asc' } : null));

  const SortIcon = ({ k }: { k: SortKey }) =>
    sort?.key === k ? (sort.dir === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />;

  const Th = ({ k, label, className = '' }: { k: SortKey; label: string; className?: string }) => (
    <button onClick={() => toggleSort(k)} className={`flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ${className}`}>
      {label} <SortIcon k={k} />
    </button>
  );

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Marchés</h3>
        <Link to="/dashboard/strategy?tab=marches" className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          Plus <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex gap-5 mt-3 overflow-x-auto border-b border-border/60">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative whitespace-nowrap pb-2.5 text-sm font-medium transition-colors ${tab === t.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
            {tab === t.key && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] items-center gap-x-4 px-1 py-3">
        <Th k="name" label="Crypto" />
        <Th k="price" label="Prix" className="justify-end" />
        <Th k="change" label="Variation" className="justify-end" />
        <Th k="volume" label="Volume 24 h" className="hidden md:flex justify-end" />
        <span className="hidden md:block text-xs text-muted-foreground text-right w-14">Trader</span>
      </div>

      {rows.length === 0 && (
        <div className="py-10 text-center text-sm text-muted-foreground">
          {tab === 'favori' ? 'Aucun favori pour le moment — cliquez sur l’étoile d’une crypto pour l’ajouter.' : 'Aucune donnée.'}
        </div>
      )}

      {rows.map((c) => {
        const positive = c.price_change_percentage_24h >= 0;
        return (
          <div key={c.id} className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] items-center gap-x-4 px-1 py-2.5 rounded-md hover:bg-secondary/60 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => toggleFavorite(c.id)} aria-label="Favori" className="shrink-0">
                <Star className={`w-3.5 h-3.5 ${isFavorite(c.id) ? 'fill-primary text-primary' : 'text-muted-foreground/60 hover:text-primary'}`} />
              </button>
              {c.image && <img src={c.image} alt={c.symbol} className="w-6 h-6 rounded-full shrink-0" />}
              <div className="min-w-0">
                <div className="text-sm font-semibold uppercase leading-tight">{c.symbol}</div>
                <div className="text-[11px] text-muted-foreground truncate leading-tight">{c.name}</div>
              </div>
            </div>
            <div className="text-sm font-medium text-right tabular-nums font-mono">{fmtPrice(c.current_price)}</div>
            <div className={`text-sm font-medium text-right tabular-nums font-mono ${positive ? 'text-success' : 'text-destructive'}`}>
              {positive ? '+' : ''}{c.price_change_percentage_24h.toFixed(2)} %
            </div>
            <div className="hidden md:block text-sm text-right text-muted-foreground tabular-nums font-mono">{fmtVolume(c.total_volume)}</div>
            <Link
              to={`/dashboard/trade?pair=${c.symbol.toUpperCase()}USDT`}
              className="hidden md:block w-14 text-right text-sm underline underline-offset-2 text-foreground hover:text-primary transition-colors"
            >
              Trader
            </Link>
          </div>
        );
      })}
    </div>
  );
}
