import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Bande de prix défilante affichée en haut du dashboard, dans une carte —
// reprend la disposition du ticker du template Forexo (carte pleine largeur,
// tout en haut de la page).
export function DashboardTicker() {
  const { prices, loading } = useCryptoPrices();

  if (loading) {
    return (
      <div className="glass-card px-4 py-3 overflow-hidden">
        <div className="flex items-center gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-2 animate-pulse">
              <div className="w-5 h-5 rounded-full bg-muted" />
              <div className="w-16 h-3 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const tickerContent = [...prices, ...prices].map((crypto, index) => (
    <div key={`${crypto.id}-${index}`} className="flex items-center gap-2 px-5 whitespace-nowrap">
      {crypto.image && <img src={crypto.image} alt={crypto.symbol} className="w-5 h-5 rounded-full" loading="lazy" />}
      <span className="text-xs font-semibold uppercase text-foreground">{crypto.symbol}</span>
      <span className="text-xs text-muted-foreground">
        ${crypto.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className={`flex items-center gap-0.5 text-[11px] font-medium ${crypto.price_change_percentage_24h >= 0 ? 'text-success' : 'text-destructive'}`}>
        {crypto.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
      </span>
    </div>
  ));

  return (
    <div className="glass-card overflow-hidden py-3">
      <div className="flex ticker-animate">{tickerContent}</div>
    </div>
  );
}
