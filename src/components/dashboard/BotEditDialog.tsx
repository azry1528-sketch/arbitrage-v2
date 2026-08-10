import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Loader2 } from 'lucide-react';
import { BOT_STRATEGIES, defaultConfigFor, getStrategy } from '@/lib/botStrategies';
import { sanitizeDecimalInput } from '@/lib/utils';
import { MIN_BOT_AMOUNT } from '@/components/dashboard/BotWizardDialog';

const PAIRS = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'Multi-paires'];
const RISK_LEVELS = ['faible', 'moyen', 'élevé'];

export interface BotEditPayload {
  pair: string;
  risk: string;
  strategy: string;
  strategyConfig: Record<string, number | string>;
  amount: number;
}

export function BotEditDialog({
  bot, open, onOpenChange, balance, saving, onSave,
}: {
  bot: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  balance: number;
  saving?: boolean;
  onSave: (payload: BotEditPayload) => void;
}) {
  const [pair, setPair] = useState('');
  const [risk, setRisk] = useState('');
  const [strategyId, setStrategyId] = useState('');
  const [config, setConfig] = useState<Record<string, number | string>>({});
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');

  useEffect(() => {
    if (open && bot) {
      setPair(bot.pair || PAIRS[0]);
      setRisk(bot.risk_level || RISK_LEVELS[1]);
      const sid = bot.strategy || BOT_STRATEGIES[0].id;
      setStrategyId(sid);
      const existing = bot.strategy_config && Object.keys(bot.strategy_config).length > 0 ? bot.strategy_config : defaultConfigFor(sid);
      setConfig(existing);
      setAmount(String(bot.allocated_amount ?? ''));
      setAmountError('');
    }
  }, [open, bot]);

  if (!bot) return null;
  const strategy = getStrategy(strategyId);

  const selectStrategy = (id: string) => {
    setStrategyId(id);
    setConfig(defaultConfigFor(id));
  };

  const updateParam = (key: string, value: string) => {
    setConfig((c) => ({ ...c, [key]: value }));
  };

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt < MIN_BOT_AMOUNT) {
      setAmountError(`Le capital alloué doit être d'au moins $${MIN_BOT_AMOUNT}.`);
      return;
    }
    if (amt > balance + Number(bot.allocated_amount || 0)) {
      setAmountError('Solde insuffisant pour ce capital.');
      return;
    }
    setAmountError('');
    onSave({ pair, risk, strategy: strategyId, strategyConfig: config, amount: amt });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> Paramètres de {bot.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Paire</label>
              <Select value={pair} onValueChange={setPair}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAIRS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Risque</label>
              <Select value={risk} onValueChange={setRisk}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RISK_LEVELS.map((r) => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Stratégie</label>
            <div className="grid grid-cols-1 gap-2">
              {BOT_STRATEGIES.map((s) => {
                const active = s.id === strategyId;
                return (
                  <button key={s.id} type="button" onClick={() => selectStrategy(s.id)}
                    className={`text-left p-2.5 rounded-lg border flex items-center gap-2.5 transition-colors ${active ? 'border-primary/60 bg-primary/5' : 'border-border/60 hover:border-border'}`}>
                    <s.icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium flex-1">{s.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{s.risk}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 p-3 rounded-lg bg-secondary/20">
            <p className="text-xs font-semibold">Configuration — {strategy.name}</p>
            {strategy.params.map((p) => (
              <div key={p.key}>
                <label className="text-xs text-muted-foreground">{p.label}{p.suffix ? ` (${p.suffix})` : ''}</label>
                {p.type === 'select' ? (
                  <Select value={String(config[p.key] ?? p.default)} onValueChange={(v) => updateParam(p.key, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {p.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <input
                    type="number" min={p.min} max={p.max} step={p.step}
                    value={String(config[p.key] ?? p.default)}
                    onChange={(e) => updateParam(p.key, e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-input border border-border input-premium"
                  />
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Capital alloué (USD) — minimum ${MIN_BOT_AMOUNT}</label>
            <input type="text" inputMode="decimal" autoComplete="off" value={amount}
              onChange={(e) => { setAmount(sanitizeDecimalInput(e.target.value)); setAmountError(''); }}
              className={`w-full px-4 py-3 rounded-lg bg-input border input-premium ${amountError ? 'border-destructive' : 'border-border'}`} />
            {amountError && <p className="text-[11px] text-destructive mt-1">{amountError}</p>}
          </div>

          <Button className="btn-gold w-full" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : 'Enregistrer les paramètres'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
