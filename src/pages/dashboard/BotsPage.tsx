import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, Plus, Trash2, Play, Pause, ChevronRight, CheckCircle2, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTrading } from '@/contexts/TradingContext';
import { BotWizardDialog, BotWizardPayload } from '@/components/dashboard/BotWizardDialog';
import { BotEditDialog, BotEditPayload } from '@/components/dashboard/BotEditDialog';
import { getStrategy } from '@/lib/botStrategies';

const NAME_PREFIXES = ['Falcon', 'Nova', 'Quantum', 'Orion', 'Titan', 'Vertex', 'Nimbus', 'Zenith', 'Comet', 'Atlas'];

function randomBotName() {
  const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${suffix}`;
}

// Les 3 étapes de déploiement d'un bot : plus le bot a de paramètres
// (paire, risque, stratégie, capital), plus l'étape d'analyse est détaillée.
const DEPLOY_STEPS = [
  { key: 1, title: 'Étape 1/3 — Analyse des paramètres', desc: 'Lecture de la paire, du niveau de risque, de la stratégie et du capital alloué...' },
  { key: 2, title: 'Étape 2/3 — Calibration de l\'algorithme', desc: 'Ajustement du moteur de calcul selon la stratégie et le profil de risque choisis...' },
  { key: 3, title: 'Étape 3/3 — Déploiement du bot', desc: 'Connexion aux exchanges et démarrage de la session de trading...' },
];

export default function BotsPage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { isBotRunning, startBotSession, getRunnerByBot, stopBotSessions } = useTrading();
  const [bots, setBots] = useState<any[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<BotWizardPayload | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);
  const [editingBot, setEditingBot] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  // Stats de la session la plus récente de chaque bot (active OU arrêtée),
  // calculées depuis la base plutôt que depuis le runner en mémoire : ce
  // dernier disparaît dès qu'on arrête le bot, ce qui donnait l'impression
  // que les trades/gains de la session étaient effacés alors qu'ils sont
  // toujours en base. À l'arrêt, ces chiffres restent affichés tels quels.
  const [sessionStatsMap, setSessionStatsMap] = useState<Record<string, { tradeCount: number; totalGain: number }>>({});

  const fetchBots = async () => {
    if (!profile) return;
    const { data } = await supabase.from('bots' as any).select('*').eq('user_id', profile.id).order('created_at', { ascending: false });
    setBots(data || []);
  };

  const fetchSessionStats = async (botList: any[]) => {
    if (!profile || botList.length === 0) { setSessionStatsMap({}); return; }
    const botIds = botList.map((b) => b.id);
    const { data: sessions } = await supabase
      .from('arbitrage_sessions' as any)
      .select('id, bot_id, start_time, total_profit, total_trades')
      .in('bot_id', botIds)
      .order('start_time', { ascending: false });

    // Ces colonnes sont déjà maintenues à jour par le trigger côté base
    // (trg_credit_arbitrage_trade) à chaque trade inséré : on les lit
    // directement plutôt que de re-sommer arbitrage_trades côté client,
    // ce qui évitait de risquer une troncature si le nombre cumulé de
    // trades (tous bots confondus) dépassait la limite de lignes
    // retournée par une requête Supabase sans pagination.
    const map: Record<string, { tradeCount: number; totalGain: number }> = {};
    (sessions as any[] || []).forEach((s) => {
      if (map[s.bot_id]) return; // garde uniquement la session la plus récente (déjà triée desc)
      map[s.bot_id] = { tradeCount: Number(s.total_trades || 0), totalGain: Number(s.total_profit || 0) };
    });
    setSessionStatsMap(map);
  };

  useEffect(() => { fetchBots(); }, [profile?.id]);

  useEffect(() => { fetchSessionStats(bots); }, [bots]);

  // Rafraîchit les stats de session en continu (le moteur serveur génère
  // des trades même si le bot a été mis en pause côté client entre-temps).
  useEffect(() => {
    const t = setInterval(() => fetchSessionStats(bots), 4000);
    return () => clearInterval(t);
  }, [bots]);

  const createBot = async (payload: BotWizardPayload) => {
    if (!profile) return;
    setPendingPayload(payload);
    setShowWizard(false);

    // Déploiement en 3 étapes, avec un léger délai réaliste entre chaque étape.
    setDeploying(true);
    setDeployStep(1);
    await new Promise((r) => setTimeout(r, 1600));
    setDeployStep(2);
    await new Promise((r) => setTimeout(r, 1800));
    setDeployStep(3);
    await new Promise((r) => setTimeout(r, 1500));

    const { data, error } = await supabase.from('bots' as any).insert({
      user_id: profile.id, name: randomBotName(), pair: payload.pair, risk_level: payload.risk,
      strategy: payload.strategy, strategy_config: payload.strategyConfig,
      allocated_amount: payload.amount, status: 'active',
    } as any).select().single();

    if (error) {
      setDeploying(false);
      setDeployStep(0);
      setPendingPayload(null);
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }

    // Déduit le capital alloué du solde principal.
    await supabase.from('profiles').update({
      balance: Number(profile.balance) - payload.amount,
    } as any).eq('id', profile.id);
    await refreshProfile();

    // Démarre automatiquement la session de trading du bot fraîchement créé.
    await startBotSession((data as any).id);

    setDeploying(false);
    setDeployStep(0);
    setPendingPayload(null);
    toast({ title: `Bot ${(data as any).name} créé et démarré`, description: 'Les gains seront automatiquement ajoutés à votre solde principal.' });
    fetchBots();
  };

  const saveEdit = async (payload: BotEditPayload) => {
    if (!editingBot || !profile) return;
    setSavingEdit(true);
    const { error } = await supabase.from('bots' as any).update({
      pair: payload.pair, risk_level: payload.risk, strategy: payload.strategy,
      strategy_config: payload.strategyConfig, allocated_amount: payload.amount,
    } as any).eq('id', editingBot.id);
    if (error) {
      setSavingEdit(false);
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }

    // Ajuste le solde principal du delta entre l'ancien et le nouveau capital alloué.
    const delta = Number(editingBot.allocated_amount || 0) - payload.amount;
    await supabase.from('profiles').update({
      balance: Number(profile.balance) + delta,
    } as any).eq('id', profile.id);
    await refreshProfile();

    setSavingEdit(false);
    toast({ title: 'Paramètres du bot mis à jour' });
    setEditingBot(null);
    fetchBots();
  };

  const deleteBot = async (bot: any) => {
    await stopBotSessions(bot.id);
    const { error } = await supabase.from('bots' as any).delete().eq('id', bot.id);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }

    // Recrédite le capital alloué au solde principal.
    if (profile) {
      await supabase.from('profiles').update({
        balance: Number(profile.balance) + Number(bot.allocated_amount || 0),
      } as any).eq('id', profile.id);
      await refreshProfile();
    }

    toast({ title: `Bot ${bot.name} supprimé` });
    fetchBots();
  };

  const toggleBot = async (bot: any) => {
    if (togglingId) return; // évite les doubles-clics qui créaient des sessions en double
    setTogglingId(bot.id);
    try {
      const runner = getRunnerByBot(bot.id);
      if (runner) {
        await stopBotSessions(bot.id);
      } else {
        await startBotSession(bot.id);
      }
    } finally {
      setTogglingId(null);
      fetchSessionStats(bots);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Bot className="w-6 h-6 text-primary" /> Mes bots</h2>
          <p className="text-sm text-muted-foreground">Créez et gérez vos bots de trading automatique</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="btn-gold" onClick={() => setShowWizard(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nouveau bot
          </Button>
        </div>
      </div>

      {bots.length === 0 ? (
        <div className="glass-card p-10 text-center text-muted-foreground text-sm">
          Aucun bot pour le moment. Créez votre premier bot pour démarrer le trading automatique.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bots.map((bot) => {
            const running = isBotRunning(bot.id);
            const runner = getRunnerByBot(bot.id);
            const strategy = getStrategy(bot.strategy || 'inter');
            const toggling = togglingId === bot.id;
            return (
              <motion.div key={bot.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`glass-card p-5 flex flex-col gap-3 ${running ? 'ring-1 ring-primary/40' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold">{bot.name}</div>
                      <div className="text-xs text-muted-foreground">{bot.pair} • Risque {bot.risk_level}</div>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full font-semibold ${running ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {running && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
                      </span>
                    )}
                    {running ? 'ACTIF' : 'ARRÊTÉ'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <strategy.icon className="w-3.5 h-3.5 text-primary" /> {strategy.name}
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-2 rounded bg-secondary/30">
                    <div className="text-muted-foreground">Capital alloué</div>
                    <div className="font-semibold">${Number(bot.allocated_amount).toLocaleString()}</div>
                  </div>
                  <div className="p-2 rounded bg-secondary/30">
                    <div className="text-muted-foreground">Trades {!running && <span className="normal-case">(pause)</span>}</div>
                    <div className="font-semibold">{sessionStatsMap[bot.id]?.tradeCount ?? 0}</div>
                  </div>
                  <div className="p-2 rounded bg-secondary/30">
                    <div className="text-muted-foreground">Gain {!running && <span className="normal-case">(pause)</span>}</div>
                    <div className={`font-semibold ${(sessionStatsMap[bot.id]?.totalGain ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {(sessionStatsMap[bot.id]?.totalGain ?? 0) >= 0 ? '+' : ''}${(sessionStatsMap[bot.id]?.totalGain ?? 0).toFixed(4)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <Button size="sm" variant={running ? 'destructive' : 'default'} className={!running ? 'btn-gold' : ''} onClick={() => toggleBot(bot)} disabled={toggling}>
                    {toggling ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : running ? <Pause className="w-3.5 h-3.5 mr-1.5" /> : <Play className="w-3.5 h-3.5 mr-1.5" />}
                    {running ? 'Pause' : 'Démarrer'}
                  </Button>
                  <Link to={`/dashboard/bots/${bot.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">Voir l'activité <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => setEditingBot(bot)} title="Paramètres du bot">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteBot(bot)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Assistant de création en 4 étapes */}
      <BotWizardDialog open={showWizard} onOpenChange={setShowWizard} balance={Number(profile?.balance || 0)} onSubmit={createBot} />

      {/* Édition des paramètres d'un bot existant */}
      <BotEditDialog
        bot={editingBot}
        open={!!editingBot}
        onOpenChange={(v) => { if (!v) setEditingBot(null); }}
        balance={Number(profile?.balance || 0)}
        saving={savingEdit}
        onSave={saveEdit}
      />

      {/* Popup de déploiement en 3 étapes */}
      <Dialog open={deploying} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} hideClose>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bot className="w-5 h-5 text-primary" /> Déploiement du bot</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {DEPLOY_STEPS.map((s) => (
              <div key={s.key} className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${deployStep >= s.key ? 'border-primary/40 bg-primary/5' : 'border-border/50'}`}>
                {deployStep > s.key ? (
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                ) : deployStep === s.key ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-border shrink-0" />
                )}
                <div>
                  <div className="text-sm font-semibold">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          {pendingPayload && (
            <div className="text-[11px] text-muted-foreground text-center">
              Paire : {pendingPayload.pair} • Risque : {pendingPayload.risk} • Stratégie : {getStrategy(pendingPayload.strategy).name} • Capital : ${pendingPayload.amount.toFixed(2)}
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
