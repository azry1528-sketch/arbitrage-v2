import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Search, Star, Eye, Radio, Infinity as InfinityIcon } from 'lucide-react';
import { useCryptoPrices, type CryptoPrice } from '@/hooks/useCryptoPrices';
import { useFavorites } from '@/hooks/useFavorites';

type MainTab = 'apercu' | 'actions' | 'memes' | 'suivi';
type Chain = 'tout' | 'bsc' | 'solana' | 'ethereum';
type Period = '1h' | '24h' | '7d';

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'actions', label: 'Actions' },
  { id: 'memes', label: 'Memes' },
  { id: 'suivi', label: 'Suivi' },
];

const CHAINS: { id: Chain; label: string }[] = [
  { id: 'tout', label: 'Tout' },
  { id: 'bsc', label: 'BSC' },
  { id: 'solana', label: 'Solana' },
  { id: 'ethereum', label: 'Ethereum' },
];

// Rattachement indicatif à une chaîne (l'API de prix ne fournit pas cette donnée).
const CHAIN_IDS: Record<Exclude<Chain, 'tout'>, string[]> = {
  bsc: ['binancecoin', 'pancakeswap-token', 'floki', 'trust-wallet-token', 'venus'],
  solana: ['solana', 'jupiter-exchange-solana', 'bonk', 'dogwifcoin', 'raydium', 'pyth-network', 'jito-governance-token', 'official-trump'],
  ethereum: ['ethereum', 'chainlink', 'uniswap', 'shiba-inu', 'pepe', 'aave', 'maker', 'lido-dao', 'ethena', 'the-graph', 'arbitrum', 'ondo-finance'],
};

const MEME_IDS = ['dogecoin', 'shiba-inu', 'pepe', 'bonk', 'floki', 'dogwifcoin', 'official-trump', 'fartcoin', 'pudgy-penguins', 'book-of-meme'];
const L1_IDS = ['bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2', 'tron', 'polkadot', 'cosmos', 'near', 'sui', 'aptos'];
const DEFI_IDS = ['uniswap', 'aave', 'chainlink', 'maker', 'lido-dao', 'pancakeswap-token', 'curve-dao-token', 'the-graph', 'ondo-finance'];

const PERIODS: Period[] = ['1h', '24h', '7d'];

function compact(n?: number) {
  if (!n || n <= 0) return '—';
  const units: [number, string][] = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (const [v, s] of units) {
    if (n >= v) return `$${(n / v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${s}`;
  }
  return `$${n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`;
}

const price = (n: number) =>
  `$${n.toLocaleString('fr-FR', { minimumFractionDigits: n < 1 ? 4 : 2, maximumFractionDigits: n < 1 ? 6 : 2 })}`;

function change(c: CryptoPrice, p: Period) {
  if (p === '1h') return c.price_change_percentage_1h_in_currency ?? c.price_change_percentage_24h ?? 0;
  if (p === '7d') return c.price_change_percentage_7d_in_currency ?? c.price_change_percentage_24h ?? 0;
  return c.price_change_percentage_24h ?? 0;
}

const pct = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2).replace('.', ',')}%`;

function Row({ c, p, fav, onFav }: { c: CryptoPrice; p: Period; fav: boolean; onFav: () => void }) {
  const ch = change(c, p);
  return (
    <div className="flex items-center gap-3 py-3">
      <img src={c.image} alt="" className="w-11 h-11 rounded-full shrink-0" loading="lazy" />
      <Link to={`/dashboard/portefeuille/trader?pair=${c.symbol.toUpperCase()}/USDT`} className="flex-1 min-w-0">
        <div className="text-[17px] font-semibold leading-tight truncate">{c.symbol.toUpperCase()}</div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
          <button
            type="button"
            aria-label={fav ? 'Retirer du suivi' : 'Ajouter au suivi'}
            aria-pressed={fav}
            onClick={(e) => { e.preventDefault(); onFav(); }}
          >
            <Star className={`w-3.5 h-3.5 ${fav ? 'fill-primary text-primary' : 'fill-primary/40 text-primary/40'}`} />
          </button>
          <span className="tabular-nums">{compact(c.total_volume)}</span>
          <span className="opacity-40">|</span>
          <span className="tabular-nums">{compact(c.market_cap)}</span>
        </div>
      </Link>
      <div className="text-right">
        <div className="text-[17px] font-semibold tabular-nums">{price(c.current_price)}</div>
        <div className={`text-sm tabular-nums ${ch >= 0 ? 'text-success' : 'text-destructive'}`}>{pct(ch)}</div>
      </div>
    </div>
  );
}

export default function WalletMarketsPage() {
  const navigate = useNavigate();
  const { prices, loading } = useCryptoPrices() as ReturnType<typeof useCryptoPrices> & { loading?: boolean };
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [tab, setTab] = useState<MainTab>('apercu');
  const [chain, setChain] = useState<Chain>('tout');
  const [period, setPeriod] = useState<Period>('24h');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [query, setQuery] = useState('');

  const byIds = (ids: string[]) => prices.filter((c) => ids.includes(c.id));
  const avg = (list: CryptoPrice[]) => (list.length ? list.reduce((s, c) => s + change(c, period), 0) / list.length : 0);

  const themes = useMemo(() => {
    const defs = [
      { name: 'Memecoins', list: byIds(MEME_IDS) },
      { name: 'Layer 1', list: byIds(L1_IDS) },
      { name: 'DeFi', list: byIds(DEFI_IDS) },
    ];
    return defs
      .filter((d) => d.list.length)
      .map((d) => ({ name: d.name, avg: avg(d.list), top: [...d.list].sort((a, b) => change(b, period) - change(a, period))[0] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prices, period]);

  const list = useMemo(() => {
    let base: CryptoPrice[] = prices;
    if (tab === 'memes') base = byIds(MEME_IDS);
    else if (tab === 'suivi') base = prices.filter((c) => favorites.includes(c.id));
    else if (tab === 'actions') base = [];
    else if (chain !== 'tout') base = byIds(CHAIN_IDS[chain]);

    const q = query.trim().toLowerCase();
    if (q) base = base.filter((c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    return [...base].sort((a, b) => (b.total_volume ?? 0) - (a.total_volume ?? 0)).slice(0, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prices, tab, chain, query, favorites]);

  const quick = [
    { label: 'Suivi', icon: Eye, onClick: () => setTab('suivi') },
    { label: 'Signaux', icon: Radio, onClick: () => { setTab('apercu'); setChain('tout'); setPeriod('1h'); } },
    { label: 'Perpétuels', icon: InfinityIcon, onClick: () => navigate('/dashboard/portefeuille/trader?tab=perpetuels') },
  ];

  return (
    <div className="-mx-4 md:mx-0 -mt-4 md:-mt-6 lg:mt-0 px-4 md:px-0 pt-4">
      {/* Onglets principaux */}
      <div className="flex items-center gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
        {MAIN_TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`text-[22px] font-semibold whitespace-nowrap transition-colors ${tab === t.id ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-secondary/70 px-3.5 py-3">
        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Recherche populaire : BTC"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          aria-label="Rechercher une crypto"
        />
      </div>

      {tab === 'apercu' && (
        <>
          {/* Accès rapides */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {quick.map((q) => (
              <button key={q.label} onClick={q.onClick} className="flex flex-col items-center gap-2 rounded-xl bg-secondary/70 py-4 text-sm font-medium">
                <q.icon className="w-6 h-6 text-primary" strokeWidth={1.8} />
                {q.label}
              </button>
            ))}
          </div>

          {/* Principaux thèmes */}
          {themes.length > 0 && (
            <>
              <h2 className="mt-6 text-lg font-semibold">Principaux thèmes</h2>
              <div className="mt-3 flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {themes.map((t) => (
                  <div
                    key={t.name}
                    className={`min-w-[44%] rounded-2xl p-4 ${t.avg >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}
                  >
                    <div className="font-semibold">{t.name}</div>
                    <div className={`text-sm mt-1 tabular-nums ${t.avg >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {t.avg >= 0 ? '▲' : '▼'} {Math.abs(t.avg).toFixed(2).replace('.', ',')}%
                    </div>
                    {t.top && (
                      <div className="flex items-center gap-2 mt-4 text-sm">
                        <img src={t.top.image} alt="" className="w-6 h-6 rounded-full" />
                        <span className="font-medium">{t.top.symbol.toUpperCase()}</span>
                        <span className={`tabular-nums ${change(t.top, period) >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {pct(change(t.top, period))}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Tendance */}
      <div className="mt-6">
        <div className="flex items-center gap-4">
          <Star className="w-5 h-5 text-muted-foreground" />
          <span className="text-[19px] font-semibold">{tab === 'suivi' ? 'Suivi' : tab === 'memes' ? 'Memes' : tab === 'actions' ? 'Actions' : 'Tendance'}</span>
        </div>

        {tab === 'apercu' && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CHAINS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChain(c.id)}
                  className={`text-[15px] font-medium whitespace-nowrap ${chain === c.id ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="relative shrink-0">
              <button onClick={() => setPeriodOpen((o) => !o)} className="flex items-center gap-1 text-[15px] font-medium">
                {period} <ChevronDown className="w-4 h-4" />
              </button>
              {periodOpen && (
                <div className="absolute right-0 z-10 mt-2 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                  {PERIODS.map((p) => (
                    <button
                      key={p}
                      onClick={() => { setPeriod(p); setPeriodOpen(false); }}
                      className={`block w-full px-5 py-2 text-left text-sm ${p === period ? 'text-primary' : ''}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Vol. / Capitalisation</span>
          <span>Dernier prix / Modifier</span>
        </div>

        {list.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">
            {tab === 'actions'
              ? 'Les actions tokenisées arrivent bientôt.'
              : tab === 'suivi'
                ? 'Aucun suivi pour le moment. Touchez l’étoile d’une crypto pour l’ajouter ici.'
                : loading
                  ? 'Chargement des prix…'
                  : 'Aucun résultat.'}
          </div>
        ) : (
          <div className="divide-y divide-border/40 pb-4">
            {list.map((c) => (
              <Row key={c.id} c={c} p={period} fav={isFavorite(c.id)} onFav={() => toggleFavorite(c.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
