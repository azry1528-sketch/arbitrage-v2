import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function CryptoTicker() {
  const { prices, loading } = useCryptoPrices();

  if (loading) {
    return (
      <div className="w-full bg-secondary/50 py-3 overflow-hidden border-y border-border/30">
        <div className="flex items-center justify-center gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-2 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-muted"></div>
              <div className="w-16 h-4 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const tickerContent = [...prices, ...prices].map((crypto, index) => (
    <div key={`${crypto.id}-${index}`} className="flex items-center gap-3 px-6 whitespace-nowrap">
      {crypto.image && <img src={crypto.image} alt={crypto.symbol} className="w-5 h-5 rounded-full" loading="lazy" />}
      <span className="text-sm font-semibold uppercase text-foreground">{crypto.symbol}</span>
      <span className="text-sm text-muted-foreground">
        ${crypto.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className={`flex items-center gap-1 text-xs font-medium ${crypto.price_change_percentage_24h >= 0 ? 'text-success' : 'text-destructive'}`}>
        {crypto.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
      </span>
    </div>
  ));

  return (
    <div className="w-full bg-secondary/30 py-3 overflow-hidden border-y border-border/30">
      <div className="flex ticker-animate">{tickerContent}</div>
    </div>
  );
}
