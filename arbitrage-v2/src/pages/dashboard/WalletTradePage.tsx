import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WalletSetupDialog } from '@/components/dashboard/WalletSetupDialog';
import { SwapWarningSheet } from '@/components/dashboard/SwapWarningSheet';
import { ArrowDownUp, ChevronDown, FileX2, Filter, SlidersHorizontal } from 'lucide-react';
import { useCryptoPrices, type CryptoPrice } from '@/hooks/useCryptoPrices';

type Mode = 'swapper' | 'bridge' | 'pro' | 'perpetuels';
type Bottom = 'ordres' | 'avoirs' | 'strategie';

const MODES: { id: Mode; label: string }[] = [
  { id: 'swapper', label: 'Swapper' },
  { id: 'bridge', label: 'Bridge' },
  { id: 'pro', label: 'Pro' },
  { id: 'perpetuels', label: 'Perpétuels' },
];

const BOTTOM: { id: Bottom; label: string }[] = [
  { id: 'ordres', label: 'Ordres ouverts' },
  { id: 'avoirs', label: 'Avoirs' },
  { id: 'strategie', label: 'Stratégie' },
];

const fmt = (n: number, max = 6) => n.toLocaleString('fr-FR', { maximumFractionDigits: max });

function TokenSelect({ value, coins, onChange }: { value: string; coins: CryptoPrice[]; onChange: (id: string) => void }) {
  const cur = coins.find((c) => c.id === value);
  return (
    <label className="relative flex items-center gap-2 cursor-pointer">
      {cur && <img src={cur.image} alt="" className="w-10 h-10 rounded-full" />}
      <span className="text-xl font-semibold">{cur ? cur.symbol.toUpperCase() : '—'}</span>
      <ChevronDown className="w-4 h-4 text-muted-foreground" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label="Choisir un token"
      >
        {coins.map((c) => (
          <option key={c.id} value={c.id}>{c.symbol.toUpperCase()} — {c.name}</option>
        ))}
      </select>
    </label>
  );
}

export default function WalletTradePage() {
  const { prices } = useCryptoPrices();
  const [params, setParams] = useSearchParams();

  const rawMode = params.get('tab');
  const mode: Mode = MODES.some((m) => m.id === rawMode) ? (rawMode as Mode) : 'swapper';
  const setMode = (m: Mode) => {
    const next = new URLSearchParams(params);
    if (m === 'swapper') next.delete('tab'); else next.set('tab', m);
    setParams(next, { replace: true });
  };

  const coins = useMemo(() => prices.slice(0, 50), [prices]);
  const bySymbol = (s: string) => coins.find((c) => c.symbol.toLowerCase() === s.toLowerCase())?.id;

  const pairBase = params.get('pair')?.split('/')[0];
  const [fromId, setFromId] = useState<string>(() => bySymbol('bnb') ?? 'binancecoin');
  const [toId, setToId] = useState<string>(() => (pairBase && bySymbol(pairBase)) || bySymbol('usdt') || 'tether');
  const [amount, setAmount] = useState('');
  const [bottom, setBottom] = useState<Bottom>('ordres');
  const [setupOpen, setSetupOpen] = useState(false);
  const [onlyCurrent, setOnlyCurrent] = useState(false);

  const from = coins.find((c) => c.id === fromId);
  const to = coins.find((c) => c.id === toId);
  const qty = parseFloat(amount.replace(',', '.'));
  const valid = Number.isFinite(qty) && qty > 0;
  const usd = valid && from ? qty * from.current_price : 0;
  const out = valid && from && to ? (qty * from.current_price) / to.current_price : 0;

  const flip = () => { setFromId(toId); setToId(fromId); };

  return (
    <div className="-mx-4 md:mx-0 -mt-4 md:-mt-6 lg:mt-0 px-4 md:px-0 pt-4 max-w-xl mx-auto">
      <WalletSetupDialog open={setupOpen} onClose={() => setSetupOpen(false)} />
      <SwapWarningSheet />
      {/* Modes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
          {MODES.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className={`text-[22px] font-semibold whitespace-nowrap transition-colors ${mode === m.id ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <SlidersHorizontal className="w-5 h-5 text-muted-foreground shrink-0 ml-3" />
      </div>

      {mode === 'swapper' ? (
        <div className="mt-5">
          <div className="text-sm text-muted-foreground mb-2">De</div>
          <div className="rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between p-4">
              <TokenSelect value={fromId} coins={coins} onChange={setFromId} />
              <div className="text-right">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0,00"
                  aria-label="Montant à échanger"
                  className="w-32 bg-transparent text-right text-2xl font-semibold outline-none placeholder:text-muted-foreground/60"
                />
                <div className="text-xs text-muted-foreground tabular-nums">≈ {valid ? `$${fmt(usd, 2)}` : '--'}</div>
              </div>
            </div>
            <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground flex justify-between">
              <span>Prix</span>
              <span className="tabular-nums">{from ? `$${fmt(from.current_price)}` : '--'}</span>
            </div>
          </div>

          <div className="flex justify-center -my-4 relative z-10">
            <button
              onClick={flip}
              aria-label="Inverser"
              className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center"
            >
              <ArrowDownUp className="w-5 h-5" />
            </button>
          </div>

          <div className="text-sm text-muted-foreground mb-2">À</div>
          <div className="rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between p-4">
              <TokenSelect value={toId} coins={coins} onChange={setToId} />
              <div className="text-right">
                <div className="text-2xl font-semibold tabular-nums">{valid ? fmt(out) : '--'}</div>
                <div className="text-xs text-muted-foreground tabular-nums">≈ {valid ? `$${fmt(usd, 2)}` : '--'}</div>
              </div>
            </div>
            <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground flex justify-between">
              <span>Prix</span>
              <span className="tabular-nums">{to ? `$${fmt(to.current_price)}` : '--'}</span>
            </div>
          </div>

          <button
            onClick={() => setSetupOpen(true)}
            className="mt-5 block w-full text-center py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:brightness-95 transition"
          >
            Configurer le portefeuille
          </button>
        </div>
      ) : (
        <div className="mt-10 rounded-2xl bg-card border border-border py-14 text-center text-sm text-muted-foreground">
          {MODES.find((m) => m.id === mode)?.label} — bientôt disponible.
        </div>
      )}

      {/* Ordres / Avoirs / Stratégie */}
      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-5">
          {BOTTOM.map((b) => (
            <button
              key={b.id}
              onClick={() => setBottom(b.id)}
              className={`text-base font-semibold pb-1 border-b-2 ${bottom === b.id ? 'text-foreground border-primary' : 'text-muted-foreground border-transparent'}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 border-t border-border pt-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={onlyCurrent} onChange={(e) => setOnlyCurrent(e.target.checked)} className="w-4 h-4 accent-[hsl(var(--primary))]" />
          Afficher uniquement le token actuel
        </label>
        <Filter className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="py-16 flex flex-col items-center text-muted-foreground">
        <FileX2 className="w-14 h-14 opacity-60" strokeWidth={1.2} />
        <div className="mt-3 text-sm">
          {bottom === 'ordres' ? 'Aucun ordre' : bottom === 'avoirs' ? 'Aucun avoir' : 'Aucune stratégie'}
        </div>
      </div>
    </div>
  );
}
