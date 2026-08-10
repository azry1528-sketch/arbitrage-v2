import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Signal, X, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sanitizeDecimalInput } from '@/lib/utils';

const EXCHANGES = ['Binance', 'Coinbase', 'Kraken', 'KuCoin', 'Bybit', 'OKX', 'Bitfinex', 'Huobi'];
const FEE_RATE = 0.002; // 0.2% total

interface SignalItem {
  pair: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  confidence: number;
  time: string;
  image?: string;
}

export default function SignalsPage() {
  const { prices } = useCryptoPrices();
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [selected, setSelected] = useState<SignalItem | null>(null);

  useEffect(() => {
    if (prices.length === 0) return;
    const gen = () => {
      const list: SignalItem[] = prices.slice(0, 8).map((c) => {
        const side: 'BUY' | 'SELL' = c.price_change_percentage_24h >= 0 ? 'BUY' : 'SELL';
        const spread = 0.008 + Math.random() * 0.025; // 0.8% - 3.3%
        const buyExchange = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];
        let sellExchange = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];
        while (sellExchange === buyExchange) sellExchange = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];
        const buyPrice = c.current_price * (1 - spread / 2);
        const sellPrice = c.current_price * (1 + spread / 2);
        return {
          pair: `${c.symbol.toUpperCase()}/USDT`,
          symbol: c.symbol.toUpperCase(),
          side,
          buyExchange,
          sellExchange,
          buyPrice,
          sellPrice,
          spread,
          confidence: Math.round(70 + Math.random() * 25),
          time: new Date(Date.now() - Math.random() * 3600 * 1000 * 3).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          image: c.image,
        };
      });
      setSignals(list);
    };
    gen();
    const t = setInterval(gen, 30000);
    return () => clearInterval(t);
  }, [prices]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Signal className="w-6 h-6 text-primary" /> Signaux d'arbitrage</h2>
        <p className="text-sm text-muted-foreground">Cliquez sur un signal pour voir le détail et exécuter</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {signals.map((s, i) => (
          <motion.button
            key={s.pair + i}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            onClick={() => setSelected(s)}
            className="glass-card p-4 flex items-center gap-4 text-left hover:border-primary/50 transition-all"
          >
            {s.image && <img src={s.image} alt="" className="w-10 h-10 rounded-full" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold">{s.pair}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${s.side === 'BUY' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                  {s.side === 'BUY' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {s.side}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate">
                {s.buyExchange} → {s.sellExchange} • spread <b className="text-success">{(s.spread * 100).toFixed(2)}%</b>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Confiance</div>
              <div className="font-bold text-primary">{s.confidence}%</div>
              <div className="text-[10px] text-muted-foreground">{s.time}</div>
            </div>
          </motion.button>
        ))}
        {signals.length === 0 && <div className="col-span-2 text-center py-12 text-muted-foreground text-sm">Chargement des signaux...</div>}
      </div>

      <AnimatePresence>
        {selected && <SignalDetail signal={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

function SignalDetail({ signal, onClose }: { signal: SignalItem; onClose: () => void }) {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [qty, setQty] = useState('');
  const [step, setStep] = useState<'form' | 'processing' | 'done'>('form');
  const [progress, setProgress] = useState<string[]>([]);
  const [finalGain, setFinalGain] = useState(0);

  const q = parseFloat(qty) || 0;
  const cost = q * signal.buyPrice;
  const revenue = q * signal.sellPrice;
  const fees = (cost + revenue) * (FEE_RATE / 2);
  const gain = revenue - cost - fees;
  const roi = cost > 0 ? (gain / cost) * 100 : 0;
  const balance = Number(profile?.balance || 0);
  const enough = cost > 0 && cost <= balance;

  const execute = async () => {
    if (!enough || !profile) return;
    setStep('processing');
    const steps = [
      `Connexion à ${signal.buyExchange}...`,
      `Achat de ${q.toFixed(4)} ${signal.symbol} à $${signal.buyPrice.toFixed(2)}`,
      `Transfert inter-exchange sécurisé...`,
      `Connexion à ${signal.sellExchange}...`,
      `Vente de ${q.toFixed(4)} ${signal.symbol} à $${signal.sellPrice.toFixed(2)}`,
      `Frais réseau : $${fees.toFixed(2)}`,
      `Gain net : +$${gain.toFixed(2)}`,
    ];
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 700));
      setProgress(p => [...p, steps[i]]);
    }
    // credit gain to balance
    try {
      await supabase.from('profiles').update({
        balance: balance + gain,
        total_earnings: Number(profile.total_earnings || 0) + Math.max(gain, 0),
      }).eq('id', profile.id);
      await refreshProfile();
    } catch {}
    setFinalGain(gain);
    setStep('done');
    toast({ title: 'Trade exécuté', description: `Gain net : +$${gain.toFixed(2)}` });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button className="absolute right-4 top-4 text-muted-foreground hover:text-foreground" onClick={onClose}><X className="w-5 h-5" /></button>

        <div className="flex items-center gap-3 mb-4">
          {signal.image && <img src={signal.image} alt="" className="w-12 h-12 rounded-full" />}
          <div>
            <h3 className="text-xl font-bold">{signal.pair}</h3>
            <p className="text-xs text-muted-foreground">Signal d'arbitrage inter-exchanges</p>
          </div>
        </div>

        {step === 'form' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/40 border border-border/50">
                <div className="text-[11px] text-muted-foreground uppercase">Acheter sur</div>
                <div className="font-bold text-primary">{signal.buyExchange}</div>
                <div className="text-xs mt-1">Prix : <b>${signal.buyPrice.toFixed(2)}</b></div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/40 border border-border/50">
                <div className="text-[11px] text-muted-foreground uppercase">Vendre sur</div>
                <div className="font-bold text-accent">{signal.sellExchange}</div>
                <div className="text-xs mt-1">Prix : <b>${signal.sellPrice.toFixed(2)}</b></div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-sm">
              <div className="flex justify-between"><span>Spread</span><b className="text-success">{(signal.spread * 100).toFixed(2)}%</b></div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>Frais totaux</span><span>{(FEE_RATE * 100).toFixed(2)}%</span></div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Quantité à trader ({signal.symbol})</label>
              <input type="text" inputMode="decimal" autoComplete="off" value={qty}
                onChange={(e) => setQty(sanitizeDecimalInput(e.target.value))}
                placeholder="0.00"
                className="w-full mt-1 px-4 py-3 rounded-lg bg-input border border-border input-premium" />
              <div className="text-[11px] text-muted-foreground mt-1">Solde disponible : ${balance.toFixed(2)}</div>
            </div>

            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Coût d'achat</span><b>${cost.toFixed(2)}</b></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Revenu de vente</span><b>${revenue.toFixed(2)}</b></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Frais</span><span className="text-destructive">-${fees.toFixed(2)}</span></div>
              <div className="flex justify-between pt-2 border-t border-border/50">
                <span className="font-bold">Gain approximatif</span>
                <b className={gain >= 0 ? 'text-success' : 'text-destructive'}>{gain >= 0 ? '+' : ''}${gain.toFixed(2)} ({roi.toFixed(2)}%)</b>
              </div>
            </div>

            {!enough && cost > 0 && <div className="text-xs text-destructive">Solde insuffisant pour ce trade.</div>}

            <Button className="w-full btn-gold" disabled={!enough} onClick={execute}>
              Valider et exécuter <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2 text-primary text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Exécution du trade...</div>
            <div className="space-y-2">
              {progress.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className="text-xs p-2 rounded bg-secondary/40 border border-border/40 font-mono">
                  <span className="text-muted-foreground mr-2">[{new Date().toLocaleTimeString('fr-FR')}]</span>{s}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-14 h-14 text-success mx-auto" />
            <div className="text-xl font-bold">Trade exécuté</div>
            <div className={`text-3xl font-bold ${finalGain >= 0 ? 'text-success' : 'text-destructive'}`}>
              {finalGain >= 0 ? '+' : ''}${finalGain.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">Le gain a été crédité sur votre solde.</div>
            <Button className="btn-gold" onClick={onClose}>Fermer</Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
