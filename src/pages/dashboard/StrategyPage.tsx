import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Zap, TrendingUp, TrendingDown, Layers, Activity, Bot, Lock,
  Sparkles, ChevronDown, Clock,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface StrategyDef {
  id: string;
  icon: typeof Zap;
  name: string;
  risk: 'Faible' | 'Moyen' | 'Élevé';
  desc: string;
  premium?: boolean;
}

const STRATEGIES: StrategyDef[] = [
  { id: 'inter', icon: Zap, name: 'Arbitrage inter-exchanges', risk: 'Faible',
    desc: 'Achat sur un exchange à bas prix, revente instantanée sur un exchange à prix plus élevé. Aucune exposition directionnelle.' },
  { id: 'triangular', icon: Layers, name: 'Arbitrage triangulaire', risk: 'Faible',
    desc: 'Exploitation des déséquilibres entre 3 paires de crypto sur un même exchange. Ultra-rapide et sécurisé.' },
  { id: 'stat', icon: Activity, name: 'Statistical arbitrage', risk: 'Moyen',
    desc: 'Modèles statistiques et machine learning pour détecter des inefficiences de marché récurrentes.' },
  { id: 'mm', icon: Bot, name: 'Market making AI', risk: 'Moyen',
    desc: 'Positionnement automatique sur le carnet d\'ordres pour capter le spread bid/ask sur les paires liquides.', premium: true },
];

const PREMIUM_UNLOCK_THRESHOLD = 500;
const DEFAULT_ENABLED: Record<string, boolean> = { inter: true, triangular: true, stat: true, mm: false };

interface Settings { enabled: boolean; allocation_pct: number; min_profit_threshold: number }
interface BotRow { id: string; strategy: string; status: string; allocated_amount: number }
interface SessionRow { id: string; bot_id: string; total_profit: number; total_trades: number }
interface TradeRow { id: string; session_id: string; profit: number; crypto_pair: string; executed_at: string }

export default function StrategyPage() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [settings, setSettings] = useState<Record<string, Settings>>({});
  const [bots, setBots] = useState<BotRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdvanced, setOpenAdvanced] = useState<string | null>(null);

  const totalEarnings = Number(profile?.total_earnings || 0);
  const premiumUnlocked = totalEarnings >= PREMIUM_UNLOCK_THRESHOLD;

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      setLoading(true);

      const { data: settingsRows } = await supabase
        .from('user_strategy_settings' as any)
        .select('*')
        .eq('user_id', profile.id);

      const map: Record<string, Settings> = {};
      for (const s of STRATEGIES) {
        const row = (settingsRows as any)?.find((r: any) => r.strategy === s.id);
        map[s.id] = row
          ? { enabled: row.enabled, allocation_pct: Number(row.allocation_pct), min_profit_threshold: Number(row.min_profit_threshold) }
          : { enabled: DEFAULT_ENABLED[s.id], allocation_pct: 25, min_profit_threshold: 0.1 };
      }
      setSettings(map);

      const { data: botRows } = await supabase
        .from('bots' as any)
        .select('id, strategy, status, allocated_amount')
        .eq('user_id', profile.id);
      const botList = (botRows as any) || [];
      setBots(botList);

      const botIds = botList.map((b: BotRow) => b.id);
      if (botIds.length > 0) {
        const { data: sessionRows } = await supabase
          .from('arbitrage_sessions' as any)
          .select('id, bot_id, total_profit, total_trades')
          .in('bot_id', botIds);
        const sessionList = (sessionRows as any) || [];
        setSessions(sessionList);

        const sessionIds = sessionList.map((s: SessionRow) => s.id);
        if (sessionIds.length > 0) {
          const { data: tradeRows } = await supabase
            .from('arbitrage_trades' as any)
            .select('id, session_id, profit, crypto_pair, executed_at')
            .in('session_id', sessionIds)
            .order('executed_at', { ascending: false })
            .limit(150);
          setTrades((tradeRows as any) || []);
        }
      }

      setLoading(false);
    })();
  }, [profile?.id]);

  // ----- Statistiques réelles par stratégie (bots -> sessions -> trades) -----
  const statsByStrategy = useMemo(() => {
    const map: Record<string, {
      totalProfit: number; totalTrades: number; allocatedCapital: number;
      winRate: number | null; recentTrades: TradeRow[]; botsCount: number;
    }> = {};
    for (const s of STRATEGIES) {
      const stratBots = bots.filter((b) => b.strategy === s.id);
      const botIds = stratBots.map((b) => b.id);
      const stratSessions = sessions.filter((se) => botIds.includes(se.bot_id));
      const totalProfit = stratSessions.reduce((sum, se) => sum + Number(se.total_profit || 0), 0);
      const totalTrades = stratSessions.reduce((sum, se) => sum + Number(se.total_trades || 0), 0);
      const allocatedCapital = stratBots.filter((b) => b.status === 'active').reduce((sum, b) => sum + Number(b.allocated_amount || 0), 0);
      const sessionIds = stratSessions.map((se) => se.id);
      const stratTrades = trades.filter((t) => sessionIds.includes(t.session_id));
      const wins = stratTrades.filter((t) => Number(t.profit) > 0).length;
      const winRate = stratTrades.length > 0 ? (wins / stratTrades.length) * 100 : null;
      map[s.id] = { totalProfit, totalTrades, allocatedCapital, winRate, recentTrades: stratTrades.slice(0, 5), botsCount: stratBots.length };
    }
    return map;
  }, [bots, sessions, trades]);

  const totalAllocation = STRATEGIES.reduce((sum, s) => sum + (settings[s.id]?.allocation_pct || 0), 0);

  // ----- Suggestion automatique -----
  const suggested = useMemo(() => {
    const enabledWithTrades = STRATEGIES.filter((s) => settings[s.id]?.enabled && statsByStrategy[s.id]?.totalTrades > 0);
    if (enabledWithTrades.length === 0) return 'inter';
    return enabledWithTrades.reduce((best, s) =>
      statsByStrategy[s.id].totalProfit > statsByStrategy[best.id].totalProfit ? s : best
    ).id;
  }, [settings, statsByStrategy]);

  const persist = async (id: string, patch: Partial<Settings>) => {
    if (!profile?.id) return;
    const next = { ...settings, [id]: { ...settings[id], ...patch } };
    setSettings(next);
    await supabase.from('user_strategy_settings' as any).upsert(
      { user_id: profile.id, strategy: id, ...next[id] },
      { onConflict: 'user_id,strategy' }
    );
  };

  const toggle = (s: StrategyDef) => {
    if (s.premium && !premiumUnlocked && !settings[s.id]?.enabled) {
      toast({ title: 'Stratégie verrouillée', description: `Débloquez-la à partir de $${PREMIUM_UNLOCK_THRESHOLD} de gains cumulés.` });
      return;
    }
    const next = !settings[s.id]?.enabled;
    persist(s.id, { enabled: next });
    toast({ title: next ? `${s.name} activée` : `${s.name} désactivée` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Stratégies d'arbitrage</h2>
        <p className="text-sm text-muted-foreground">Activez vos moteurs, répartissez votre capital et suivez leur performance réelle</p>
      </div>

      {/* Allocation totale */}
      <div className={`rounded-2xl px-4 py-3 border text-sm flex items-center justify-between ${totalAllocation > 100 ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-card border-border/60 text-muted-foreground'}`}>
        <span>Allocation de capital totale</span>
        <span className="font-semibold">{totalAllocation}% {totalAllocation > 100 && '— dépasse 100%'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STRATEGIES.map((s, i) => {
          const st = settings[s.id];
          const on = !!st?.enabled;
          const stats = statsByStrategy[s.id];
          const locked = s.premium && !premiumUnlocked;
          const isSuggested = suggested === s.id && on;

          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-[20px] p-5 flex flex-col gap-4 bg-card border transition-colors duration-200 ${on ? 'border-primary/40' : 'border-border/60 opacity-90'}`}>

              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center relative">
                  <s.icon className="w-6 h-6 text-primary" strokeWidth={2} />
                  {locked && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center">
                      <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isSuggested && (
                    <span className="text-[10px] px-2 py-1 rounded-full font-semibold bg-amber-400/15 text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Suggérée
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${on ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {on ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <Switch checked={on} onCheckedChange={() => toggle(s)} disabled={locked && !on} />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{s.name}</h3>
                  {s.premium && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">PREMIUM</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                {locked && (
                  <p className="text-xs text-amber-400 mt-2">
                    🔒 Débloquée à ${PREMIUM_UNLOCK_THRESHOLD} de gains cumulés (actuellement ${totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1"><Shield className="w-3 h-3 text-primary" /> Risque : <b>{s.risk}</b></div>
                <div className="flex items-center gap-1"><Bot className="w-3 h-3 text-muted-foreground" /> {stats?.botsCount || 0} bot{(stats?.botsCount || 0) > 1 ? 's' : ''}</div>
              </div>

              {/* Statistiques de performance réelles */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Profit total</div>
                  <div className={`text-sm font-bold ${(stats?.totalProfit || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {loading ? '—' : `${(stats?.totalProfit || 0) >= 0 ? '+' : ''}$${(stats?.totalProfit || 0).toFixed(2)}`}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Trades</div>
                  <div className="text-sm font-bold">{loading ? '—' : stats?.totalTrades || 0}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Réussite</div>
                  <div className="text-sm font-bold">{loading || stats?.winRate === null ? '—' : `${stats.winRate.toFixed(0)}%`}</div>
                </div>
              </div>

              {/* Allocation de capital */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Allocation cible</span>
                  <span className="font-semibold">{st?.allocation_pct ?? 25}%</span>
                </div>
                <Slider
                  value={[st?.allocation_pct ?? 25]}
                  max={100} step={5}
                  disabled={locked}
                  onValueChange={([v]) => setSettings((prev) => ({ ...prev, [s.id]: { ...prev[s.id], allocation_pct: v } }))}
                  onValueCommit={([v]) => persist(s.id, { allocation_pct: v })}
                />
              </div>

              {/* Réglages avancés */}
              <Collapsible open={openAdvanced === s.id} onOpenChange={(v) => setOpenAdvanced(v ? s.id : null)}>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Réglages avancés
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openAdvanced === s.id ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Seuil de profit minimum</span>
                    <span className="font-semibold">{(st?.min_profit_threshold ?? 0.1).toFixed(2)}%</span>
                  </div>
                  <Slider
                    value={[st?.min_profit_threshold ?? 0.1]}
                    max={2} step={0.05}
                    disabled={locked}
                    onValueChange={([v]) => setSettings((prev) => ({ ...prev, [s.id]: { ...prev[s.id], min_profit_threshold: v } }))}
                    onValueCommit={([v]) => persist(s.id, { min_profit_threshold: v })}
                  />

                  {(stats?.recentTrades?.length || 0) > 0 && (
                    <div className="pt-2">
                      <div className="text-[10px] text-muted-foreground uppercase mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Derniers trades</div>
                      <div className="space-y-1">
                        {stats.recentTrades.map((t) => (
                          <div key={t.id} className="flex items-center justify-between text-xs py-1">
                            <span className="text-muted-foreground">{t.crypto_pair}</span>
                            <span className="text-muted-foreground">{new Date(t.executed_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                            <span className={`font-semibold flex items-center gap-1 ${Number(t.profit) >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {Number(t.profit) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Number(t.profit) >= 0 ? '+' : ''}${Number(t.profit).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          );
        })}
      </div>

      {/* Comparatif */}
      <div className="rounded-[20px] p-5 bg-card border border-border/60">
        <h3 className="font-semibold text-sm mb-3">Comparatif des stratégies</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-muted-foreground border-b border-border/50">
                <th className="py-2 font-medium">Stratégie</th>
                <th className="py-2 font-medium text-right">Profit total</th>
                <th className="py-2 font-medium text-right">Trades</th>
                <th className="py-2 font-medium text-right">Réussite</th>
                <th className="py-2 font-medium text-right">Allocation</th>
              </tr>
            </thead>
            <tbody>
              {STRATEGIES.map((s) => {
                const stats = statsByStrategy[s.id];
                return (
                  <tr key={s.id} className="border-b border-border/30 last:border-0">
                    <td className="py-2.5 flex items-center gap-2">
                      <s.icon className="w-3.5 h-3.5 text-primary" /> {s.name}
                    </td>
                    <td className={`py-2.5 text-right font-medium ${(stats?.totalProfit || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {(stats?.totalProfit || 0) >= 0 ? '+' : ''}${(stats?.totalProfit || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right">{stats?.totalTrades || 0}</td>
                    <td className="py-2.5 text-right">{stats?.winRate === null || stats?.winRate === undefined ? '—' : `${stats.winRate.toFixed(0)}%`}</td>
                    <td className="py-2.5 text-right">{settings[s.id]?.allocation_pct ?? 25}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
