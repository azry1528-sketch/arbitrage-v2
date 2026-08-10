import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Bot as BotIcon, CheckCircle2 } from 'lucide-react';
import { BOT_STRATEGIES, defaultConfigFor, getStrategy } from '@/lib/botStrategies';
import { sanitizeDecimalInput } from '@/lib/utils';

const PAIRS = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'Multi-paires'];
const RISK_LEVELS = ['faible', 'moyen', 'élevé'];
export const MIN_BOT_AMOUNT = 100;

export interface BotWizardPayload {
  pair: string;
  risk: string;
  strategy: string;
  strategyConfig: Record<string, number | string>;
  amount: number;
}

const WIZARD_STEPS = [
  { key: 1, title: 'Paire & niveau de risque' },
  { key: 2, title: 'Choix de la stratégie' },
  { key: 3, title: 'Configuration de la stratégie' },
  { key: 4, title: 'Capital & récapitulatif' },
];

export function BotWizardDialog({
  open, onOpenChange, balance, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  balance: number;
  onSubmit: (payload: BotWizardPayload) => void;
}) {
  const [step, setStep] = useState(1);
  const [pair, setPair] = useState(PAIRS[0]);
  const [risk, setRisk] = useState(RISK_LEVELS[1]);
  const [strategyId, setStrategyId] = useState(BOT_STRATEGIES[0].id);
  const [config, setConfig] = useState<Record<string, number | string>>(defaultConfigFor(BOT_STRATEGIES[0].id));
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');

  useEffect(() => {
    if (open) {
      setStep(1);
      setPair(PAIRS[0]);
      setRisk(RISK_LEVELS[1]);
      setStrategyId(BOT_STRATEGIES[0].id);
      setConfig(defaultConfigFor(BOT_STRATEGIES[0].id));
      setAmount('');
      setAmountError('');
    }
  }, [open]);

  const strategy = getStrategy(strategyId);
  const isLast = step === WIZARD_STEPS.length;

  const selectStrategy = (id: string) => {
    setStrategyId(id);
    setConfig(defaultConfigFor(id));
  };

  const updateParam = (key: string, value: string) => {
    setConfig((c) => ({ ...c, [key]: value }));
  };

  const validateAmount = () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt < MIN_BOT_AMOUNT) {
      setAmountError(`Le capital alloué est obligatoire (minimum $${MIN_BOT_AMOUNT}).`);
      return null;
    }
    if (amt > balance) {
      setAmountError('Solde insuffisant pour ce capital.');
      return null;
    }
    setAmountError('');
    return amt;
  };

  const goNext = () => {
    if (step === 4) {
      const amt = validateAmount();
      if (amt === null) return;
      onSubmit({ pair, risk, strategy: strategyId, strategyConfig: config, amount: amt });
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BotIcon className="w-5 h-5 text-primary" /> Créer un nouveau bot
          </DialogTitle>
        </DialogHeader>

        {/* Fil d'étapes */}
        <div className="flex items-center gap-1.5">
          {WIZARD_STEPS.map((s) => (
            <div key={s.key} className={`flex-1 h-1.5 rounded-full transition-all ${s.key <= step ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground -mt-2">Étape {step}/4 — {WIZARD_STEPS[step - 1].title}</p>

        {/* Étape 1 : paire & risque */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Choisissez la paire tradée et le niveau de risque du bot. Ces paramètres pourront être modifiés après la création.</p>
            <div>
              <label className="text-xs text-muted-foreground">Paire</label>
              <Select value={pair} onValueChange={setPair}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAIRS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Niveau de risque</label>
              <Select value={risk} onValueChange={setRisk}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RISK_LEVELS.map((r) => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Étape 2 : choix de la stratégie */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Chaque stratégie a son propre fonctionnement et ses propres paramètres à l'étape suivante.</p>
            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
              {BOT_STRATEGIES.map((s) => {
                const active = s.id === strategyId;
                return (
                  <button key={s.id} type="button" onClick={() => selectStrategy(s.id)}
                    className={`text-left p-3 rounded-lg border flex items-start gap-3 transition-colors ${active ? 'border-primary/60 bg-primary/5' : 'border-border/60 hover:border-border'}`}>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <s.icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{s.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Risque {s.risk}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                    {active && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Étape 3 : configuration de la stratégie choisie */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Configurez <b>{strategy.name}</b> pour ce bot. Ces réglages seront modifiables depuis les paramètres du bot après sa création.
            </p>
            {strategy.params.map((p) => (
              <div key={p.key}>
                <label className="text-xs text-muted-foreground">{p.label}{p.suffix ? ` (${p.suffix})` : ''}</label>
                {p.type === 'select' ? (
                  <Select value={String(config[p.key])} onValueChange={(v) => updateParam(p.key, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {p.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <input
                    type="number" min={p.min} max={p.max} step={p.step}
                    value={String(config[p.key])}
                    onChange={(e) => updateParam(p.key, e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-input border border-border input-premium"
                  />
                )}
                {p.help && <p className="text-[11px] text-muted-foreground mt-1">{p.help}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Étape 4 : capital & récapitulatif */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Capital alloué (USD) — minimum ${MIN_BOT_AMOUNT} <span className="text-destructive">*</span></label>
              <input type="text" inputMode="decimal" autoComplete="off" value={amount}
                onChange={(e) => { setAmount(sanitizeDecimalInput(e.target.value)); setAmountError(''); }}
                placeholder="1.00" required
                className={`w-full px-4 py-3 rounded-lg bg-input border input-premium ${amountError ? 'border-destructive' : 'border-border'}`} />
              {amountError && <p className="text-[11px] text-destructive mt-1">{amountError}</p>}
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 text-xs space-y-1.5">
              <div className="flex justify-between"><span className="text-muted-foreground">Paire</span><b>{pair}</b></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Risque</span><b className="capitalize">{risk}</b></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Stratégie</span><b>{strategy.name}</b></div>
              {strategy.params.map((p) => (
                <div key={p.key} className="flex justify-between">
                  <span className="text-muted-foreground">{p.label}</span>
                  <b>{config[p.key]}{p.suffix ? ` ${p.suffix}` : ''}</b>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Un nom sera généré automatiquement pour votre bot.</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
            </Button>
          )}
          <Button className="btn-gold flex-1" onClick={goNext}>
            {isLast ? 'Créer le bot' : 'Suivant'} {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
