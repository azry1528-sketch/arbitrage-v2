import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bot, Play, Pause, Loader2, Activity, TrendingUp, TrendingDown, ArrowRightLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTrading } from '@/contexts/TradingContext';
import { getStrategy } from '@/lib/botStrategies';
import { BotEditDialog, BotEditPayload } from '@/components/dashboard/BotEditDialog';

export default function BotDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { isBotRunning, startBotSession, stopBotSessions } = useTrading();
  const [bot, setBot] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [toggling, setToggling] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  // Stats de la session la plus récente (active OU arrêtée), calculées
  // depuis la base plutôt que depuis le runner en mémoire : ce dernier
  // disparaît dès qu'on arrête le bot, ce qui donnait l'impression que
  // les gains/trades de la session étaient effacés alors qu'ils sont
  // toujours en base. À l'arrêt, ces chiffres restent affichés tels
  // quels (mis en pause), au lieu de retomber à zéro.
  const [sessionStats, setSessionStats] = useState<{ tradeCount: number; totalGain: number }>({ tradeCount: 0, totalGain: 0 });

  const fetchSessionStats = async () => {
    if (!id) return;
    const { data: lastSession } = await supabase
      .from('arbitrage_sessions' as any)
      .select('id, total_profit, total_trades')
      .eq('bot_id', id)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!lastSession) { setSessionStats({ tradeCount: 0, totalGain: 0 }); return; }
    setSessionStats({
      tradeCount: Number((lastSession as any).total_trades || 0),
      totalGain: Number((lastSession as any).total_profit || 0),
    });
  };

  const fetchBot = async () => {
    if (!id) return;
    const { data } = await supabase.from('bots' as any).select('*').eq('id', id).maybeSingle();
    setBot(data);
  };

  const handleToggle = async () => {
    if (toggling || !bot) return;
    setToggling(true);
    try {
      if (isBotRunning(bot.id)) {
        await stopBotSessions(bot.id);
      } else {
        await startBotSession(bot.id);
      }
    } finally {
      setToggling(false);
    }
  };

  const saveEdit = async (payload: BotEditPayload) => {
    if (!bot || !profile) return;
    setSavingEdit(true);
    const { error } = await supabase.from('bots' as any).update({
      pair: payload.pair, risk_level: payload.risk, strategy: payload.strategy,
      strategy_config: payload.strategyConfig, allocated_amount: payload.amount,
    } as any).eq('id', bot.id);
    if (error) {
      setSavingEdit(false);
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }

    // Ajuste le solde principal du delta entre l'ancien et le nouveau capital alloué.
    const delta = Number(bot.allocated_amount || 0) - payload.amount;
    await supabase.from('profiles').update({
      balance: Number(profile.balance) + delta,
    } as any).eq('id', profile.id);
    await refreshProfile();

    setSavingEdit(false);
    toast({ title: 'Paramètres du bot mis à jour' });
    setShowEdit(false);
    fetchBot();
  };

  const fetchLogs = async () => {
    if (!id) return;
    const { data } = await supabase.from('bot_logs' as any).select('*').eq('bot_id', id).order('created_at', { ascending: false }).limit(50);
    setLogs(data || []);
  };

  useEffect(() => { fetchBot(); fetchLogs(); fetchSessionStats(); }, [id]);

  // Poll for new activity while the bot may be producing logs (le moteur
  // serveur - pg_cron - continue de générer des trades même hors ligne).
  useEffect(() => {
    const t = setInterval(() => { fetchBot(); fetchLogs(); fetchSessionStats(); }, 3000);
    return () => clearInterval(t);
  }, [id]);

  // Révèle les entrées du journal une par une, avec un léger délai,
  // pour donner l'impression que chaque étape prend du temps à s'exécuter.
  useEffect(() => {
    setVisibleCount(0);
  }, [logs.length === 0]);

  useEffect(() => {
    if (visibleCount >= logs.length) return;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), 350);
    return () => clearTimeout(t);
  }, [visibleCount, logs.length]);

  // La liste est triée du plus récent au plus ancien (logs[0] = dernière
  // activité). On force le scroll en haut du conteneur à chaque nouvelle
  // activité pour que l'utilisateur voie toujours en premier la plus
  // récente, sans avoir à remonter manuellement dans l'historique.
  const feedRef = useRef<HTMLDivElement>(null);
  const latestLogId = logs[0]?.id;
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [latestLogId]);

  if (!bot) {
    return (
      <div className="py-16 text-center text-muted-foreground text-sm">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Chargement du bot...
      </div>
    );
  }

  const running = isBotRunning(bot.id);
  const shown = logs.slice(0, visibleCount);
  const strategy = getStrategy(bot.strategy || 'inter');

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/dashboard/trade')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Retour aux bots
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{bot.name}</h2>
            <p className="text-sm text-muted-foreground">{bot.pair} • Risque {bot.risk_level} • Capital ${Number(bot.allocated_amount).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5"><strategy.icon className="w-3.5 h-3.5 text-primary" /> {strategy.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setShowEdit(true)} title="Paramètres du bot">
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            className={!running ? 'btn-gold' : ''}
            variant={running ? 'destructive' : 'default'}
            onClick={handleToggle}
            disabled={toggling}
          >
            {toggling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : running ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {running ? 'Pause' : 'Démarrer'}
          </Button>
        </div>
      </div>

      <BotEditDialog
        bot={bot}
        open={showEdit}
        onOpenChange={setShowEdit}
        balance={Number(profile?.balance || 0)}
        saving={savingEdit}
        onSave={saveEdit}
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4">
          <div className="text-[11px] text-muted-foreground uppercase">Statut</div>
          <div className={`flex items-center gap-2 text-lg font-bold mt-1 ${running ? 'text-success' : 'text-muted-foreground'}`}>
            {running && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
            )}
            {running ? 'Actif' : 'En pause'}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-[11px] text-muted-foreground uppercase">Trades session {!running && <span className="normal-case">(en pause)</span>}</div>
          <div className="text-lg font-bold mt-1">{sessionStats.tradeCount}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-[11px] text-muted-foreground uppercase">Gain session (au solde) {!running && <span className="normal-case">(en pause)</span>}</div>
          <div className={`text-lg font-bold mt-1 ${sessionStats.totalGain >= 0 ? 'text-success' : 'text-destructive'}`}>
            {sessionStats.totalGain >= 0 ? '+' : ''}${sessionStats.totalGain.toFixed(4)}
          </div>
        </div>
      </div>

      <div className="glass-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Activité récente</h3>
          {running && <span className="text-[10px] text-success">● EN DIRECT</span>}
        </div>
        {shown.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            {running ? <><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Recherche d'opportunités d'arbitrage...</> : 'Aucune activité pour ce bot pour le moment.'}
          </div>
        ) : (
          <div ref={feedRef} className="space-y-2 max-h-[560px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {shown.map((l) => {
                const isTrade = l.step === 'trade' && l.buy_exchange && l.sell_exchange;
                const profit = Number(l.profit ?? 0);
                const positive = profit >= 0;

                if (!isTrade) {
                  return (
                    <motion.div key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="p-3 rounded-lg bg-secondary/30 text-xs md:text-sm flex items-center justify-between gap-3">
                      <span className="text-muted-foreground shrink-0">{new Date(l.created_at).toLocaleTimeString('fr-FR')}</span>
                      <span className="flex-1">{l.message}</span>
                    </motion.div>
                  );
                }

                return (
                  <motion.div key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg bg-secondary/30 text-xs md:text-sm space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{new Date(l.created_at).toLocaleTimeString('fr-FR')}</span>
                      <span className="font-semibold">{l.crypto_pair}</span>
                      <span className={`flex items-center gap-1 font-bold ${positive ? 'text-success' : 'text-destructive'}`}>
                        {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {positive ? '+' : ''}${profit.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] md:text-xs">
                      <span className="px-2 py-1 rounded bg-success/10 text-success font-medium">
                        Achat {l.buy_exchange} @ ${Number(l.buy_price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                      <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                      <span className="px-2 py-1 rounded bg-destructive/10 text-destructive font-medium">
                        Vente {l.sell_exchange} @ ${Number(l.sell_price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Quantité : {Number(l.quantity).toFixed(6)} {l.crypto_pair?.split('/')[0]}
                      {l.spread_pct != null && <> • Écart : {Number(l.spread_pct).toFixed(3)}%</>}
                      {l.credits_used != null && <> • {Number(l.credits_used)} crédit{Number(l.credits_used) > 1 ? 's' : ''} utilisé{Number(l.credits_used) > 1 ? 's' : ''}</>}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {visibleCount < logs.length && (
              <div className="text-xs text-muted-foreground flex items-center gap-2 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement de l'historique...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
