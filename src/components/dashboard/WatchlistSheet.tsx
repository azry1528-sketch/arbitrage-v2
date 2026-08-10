import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';

// Reprend l'offcanvas "Watchlist" du template Forexo : liste de cryptos
// suivies, ouvrable depuis le bouton pilule de la topbar.
export function WatchlistSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { prices } = useCryptoPrices();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Watchlist</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-1 overflow-y-auto max-h-[calc(100vh-6rem)]">
          {prices.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-2.5 px-1 border-b border-border/50">
              {c.image && <img src={c.image} alt={c.symbol} className="w-8 h-8 rounded-full" />}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm uppercase">{c.symbol}</div>
                <div className="text-[11px] text-muted-foreground truncate">{c.name}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-sm">${c.current_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <div className={`flex items-center justify-end gap-0.5 text-[11px] font-medium ${c.price_change_percentage_24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {c.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(c.price_change_percentage_24h).toFixed(2)}%
                </div>
              </div>
              <Star className="w-4 h-4 text-primary fill-primary shrink-0" />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
