import { CryptoPrice } from '@/hooks/useCryptoPrices';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Rangée de mini-cartes mettant en avant les plus fortes variations —
// reprend la disposition en grille des cartes colorées (XAU/USD, EUR/USD...)
// du template Forexo, avec la palette sombre/verte d'ArbiFlow.
export function MarketMovers({ prices }: { prices: CryptoPrice[] }) {
  const top = [...prices].sort((a, b) => Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h)).slice(0, 4);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {top.map((c) => {
        const positive = c.price_change_percentage_24h >= 0;
        return (
          <div
            key={c.id}
            className={`rounded-xl p-4 border ${positive ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {c.image && <img src={c.image} alt={c.symbol} className="w-5 h-5 rounded-full" />}
              <span className="text-xs font-semibold uppercase text-foreground">{c.symbol}/USD</span>
            </div>
            <div className="text-sm font-semibold text-foreground">
              ${c.current_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${positive ? 'text-success' : 'text-destructive'}`}>
              {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {positive ? '+' : ''}{c.price_change_percentage_24h.toFixed(2)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
