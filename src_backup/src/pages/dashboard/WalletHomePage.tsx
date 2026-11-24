import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { WalletSetupDialog } from '@/components/dashboard/WalletSetupDialog';
import { Star } from 'lucide-react';
import { useCryptoPrices, type CryptoPrice } from '@/hooks/useCryptoPrices';
import { useFavorites } from '@/hooks/useFavorites';

type Tab = 'favoris' | 'tendance' | 'gagnants' | 'perdants' | 'volume';

const TABS: { id: Tab; label: string }[] = [
  { id: 'tendance', label: 'Tendance' },
  { id: 'gagnants', label: 'Gagnants' },
  { id: 'perdants', label: 'Perdants' },
  { id: 'volume', label: 'Volume' },
];

// $128,19M / $218,56B — même lecture compacte que l'app de référence
function compact(n?: number) {
  if (!n || n <= 0) return '—';
  const units: [number, string][] = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (const [v, s] of units) {
    if (n >= v) return `$${(n / v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${s}`;
  }
  return `$${n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`;
}

const price = (n: number) =>
  `$${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 6 : 2 })}`;

function Row({ c, fav, onFav }: { c: CryptoPrice; fav: boolean; onFav: () => void }) {
  const ch = c.price_change_percentage_24h ?? 0;
  const up = ch >= 0;
  return (
    <div className="flex items-center gap-3 py-3">
      <img src={c.image} alt="" className="w-11 h-11 rounded-full shrink-0" loading="lazy" />
      <Link to={`/dashboard/portefeuille/trader?pair=${c.symbol.toUpperCase()}/USDT`} className="flex-1 min-w-0">
        <div className="text-[17px] font-semibold leading-tight">{c.symbol.toUpperCase()}</div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
          <button
            type="button"
            aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
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
        <div className={`text-sm tabular-nums ${up ? 'text-success' : 'text-destructive'}`}>
          {up ? '+' : '−'}{Math.abs(ch).toFixed(2).replace('.', ',')}%
        </div>
      </div>
    </div>
  );
}

export default function WalletHomePage() {
  const { prices } = useCryptoPrices();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [tab, setTab] = useState<Tab>('tendance');
  const [setupOpen, setSetupOpen] = useState(false);
  const list = useMemo(() => {
    const ch = (c: CryptoPrice) => c.price_change_percentage_24h ?? 0;
    const top = prices.slice(0, 50);
    switch (tab) {
      case 'favoris': return prices.filter((c) => favorites.includes(c.id));
      case 'gagnants': return [...top].sort((a, b) => ch(b) - ch(a));
      case 'perdants': return [...top].sort((a, b) => ch(a) - ch(b));
      case 'volume': return [...top].sort((a, b) => (b.total_volume ?? 0) - (a.total_volume ?? 0));
      default: return top;
    }
  }, [prices, tab, favorites]);

  const shown = list.slice(0, 8);

  return (
    <div className="-mx-4 md:mx-0 -mt-4 md:-mt-6 lg:mt-0">
      <WalletSetupDialog open={setupOpen} onClose={() => setSetupOpen(false)} />
      {/* Bandeau d'accroche */}
      <section className="relative overflow-hidden px-6 pt-14 pb-16 text-center">
        {/* Fond en barres (clin d'œil aux bougies) — le masque ne touche que le fond */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--primary) / 0.07) 0 6px, transparent 6px 22px)',
            maskImage: 'linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)',
          }}
        />
        <div className="relative">
          <h1 className="text-[34px] leading-[1.15] font-bold tracking-tight">
            Tradez. Gagnez.
            <br />
            Découvrez la <span className="text-primary">blockchain</span>.
          </h1>
          <button
            onClick={() => setSetupOpen(true)}
            className="inline-block mt-8 px-7 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:brightness-95 transition"
          >
            Configurer le portefeuille
          </button>
        </div>
      </section>

      {/* Onglets */}
      <div className="px-4 md:px-0 mt-2">
        <div className="flex items-center gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'favoris'}
            aria-label="Favoris"
            onClick={() => setTab('favoris')}
            className={tab === 'favoris' ? 'text-primary' : 'text-muted-foreground'}
          >
            <Star className={`w-6 h-6 ${tab === 'favoris' ? 'fill-primary' : 'fill-current'}`} />
          </button>
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`text-[19px] font-semibold whitespace-nowrap transition-colors ${
                tab === t.id ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        <div className="mt-4 rounded-2xl bg-card border border-border px-4 pt-3 pb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Par défaut</span>
            <span className="text-foreground/90">24 h</span>
          </div>

          {shown.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {tab === 'favoris'
                ? 'Aucun favori pour le moment. Touchez l’étoile d’une crypto pour l’ajouter ici.'
                : 'Chargement des prix…'}
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {shown.map((c) => (
                <Row key={c.id} c={c} fav={isFavorite(c.id)} onFav={() => toggleFavorite(c.id)} />
              ))}
            </div>
          )}

          <Link
            to="/dashboard/portefeuille/marches"
            className="block text-center text-sm text-muted-foreground hover:text-foreground pt-4"
          >
            Voir plus
          </Link>
        </div>
      </div>
    </div>
  );
}
