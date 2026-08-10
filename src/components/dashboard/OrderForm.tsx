import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// Formulaire d'ordre Buy/Sell — reprend la disposition du panneau d'ordre du
// template Forexo. Aucune position réelle n'est envoyée : ce module sert de
// terminal de démonstration, au même titre que le formulaire du template
// d'origine (données statiques, sans backend de trading connecté).
export function OrderForm({ initialPair }: { initialPair?: string }) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [pair, setPair] = useState(initialPair || 'BTC/USDT');
  const [amount, setAmount] = useState('0.01');

  useEffect(() => {
    if (initialPair) setPair(initialPair);
  }, [initialPair]);

  const knownPairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];
  const pairOptions = knownPairs.includes(pair) ? knownPairs : [pair, ...knownPairs];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Ordre ${side === 'buy' ? "d'achat" : 'de vente'} simulé sur ${pair} (${amount})`);
  };

  return (
    <div className="glass-card p-5">
      <h3 className="font-bold mb-4">Nouvel ordre</h3>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setSide('buy')}
          className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${side === 'buy' ? 'bg-success text-white' : 'bg-secondary text-muted-foreground'}`}
        >
          Acheter
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${side === 'sell' ? 'bg-destructive text-white' : 'bg-secondary text-muted-foreground'}`}
        >
          Vendre
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Paire</Label>
          <Select value={pair} onValueChange={setPair}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {pairOptions.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Volume</Label>
          <Input type="number" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Stop Loss</Label>
            <Input type="number" placeholder="0.000" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Take Profit</Label>
            <Input type="number" placeholder="0.000" className="mt-1" />
          </div>
        </div>

        <Button type="submit" className={`w-full ${side === 'buy' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'} text-white`}>
          {side === 'buy' ? 'Acheter' : 'Vendre'} {pair.split('/')[0]}
        </Button>
      </form>
    </div>
  );
}
