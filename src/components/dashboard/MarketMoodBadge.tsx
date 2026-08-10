import { CryptoPrice } from '@/hooks/useCryptoPrices';

// Ambiance du marché — calculée à partir du vrai ratio de cryptos en
// hausse vs en baisse dans le jeu de données déjà chargé (pas d'indice
// externe type Fear & Greed, pour rester sur des données 100% réelles).
export function MarketMoodBadge({ prices }: { prices: CryptoPrice[] }) {
  if (prices.length === 0) return null;

  const gainers = prices.filter((p) => p.price_change_percentage_24h >= 0).length;
  const pct = Math.round((gainers / prices.length) * 100);

  let label = 'Neutre';
  let color = 'text-muted-foreground';
  if (pct >= 65) { label = 'Optimiste'; color = 'text-success'; }
  else if (pct <= 35) { label = 'Prudent'; color = 'text-destructive'; }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">Marché :</span>
      <span className={`font-semibold ${color}`}>{label}</span>
      <span className="text-muted-foreground">({pct}% en hausse sur 24h)</span>
    </div>
  );
}
