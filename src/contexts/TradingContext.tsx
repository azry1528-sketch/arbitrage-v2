import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Un "runner" = une session d'arbitrage active (manuelle OU liée à un bot).
//
// IMPORTANT : les trades ne sont PLUS générés ici. Ils sont générés côté
// serveur par la tâche planifiée `process_arbitrage_tick()` (pg_cron), ce
// qui garantit que le trading continue même si l'utilisateur ferme
// l'application ou change de page. Ce contexte se contente de LIRE l'état
// (via polling léger) et de démarrer/arrêter des sessions.

interface RunnerState {
  sessionId: string;
  botId: string | null;
  tradeCount: number;
  totalGain: number;
}

interface TradingContextType {
  runners: Record<string, RunnerState>; // key = sessionId
  startManualSession: () => Promise<string | null>;
  stopSession: (sessionId: string) => Promise<void>;
  startBotSession: (botId: string) => Promise<string | null>;
  stopBotSessions: (botId: string) => Promise<void>;
  isBotRunning: (botId: string) => boolean;
  getRunnerByBot: (botId: string) => RunnerState | undefined;
  refreshRunners: () => Promise<void>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export function TradingProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [runners, setRunners] = useState<Record<string, RunnerState>>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Sessions que l'utilisateur vient d'arrêter explicitement côté client.
  // Le polling (toutes les 4s) peut chevaucher une requête réseau lancée
  // juste avant l'arrêt et renvoyer un état encore "actif" légèrement
  // périmé : sans cette protection, le bot semblait "redémarrer tout
  // seul" juste après avoir été arrêté. On ignore ces sessions pendant
  // une courte fenêtre le temps que la base de données soit cohérente.
  const recentlyStoppedRef = useRef<Map<string, number>>(new Map());
  const STOP_GRACE_MS = 8000;

  const refreshRunners = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('arbitrage_sessions')
      .select('id, bot_id, total_trades, total_profit, is_active')
      .eq('user_id', profile.id)
      .eq('is_active', true);

    const now = Date.now();
    // Nettoie les entrées de grâce expirées
    recentlyStoppedRef.current.forEach((ts, sid) => {
      if (now - ts > STOP_GRACE_MS) recentlyStoppedRef.current.delete(sid);
    });

    setRunners(() => {
      const next: Record<string, RunnerState> = {};
      (data || []).forEach((s: any) => {
        if (recentlyStoppedRef.current.has(s.id)) return; // ignoré temporairement
        next[s.id] = {
          sessionId: s.id,
          botId: s.bot_id,
          tradeCount: s.total_trades || 0,
          totalGain: Number(s.total_profit || 0),
        };
      });
      return next;
    });
  };


  // Récupère l'état des sessions actives au chargement, puis rafraîchit
  // régulièrement pour refléter le travail effectué en arrière-plan par
  // le moteur serveur (pg_cron), qu'on ait quitté la page ou non.
  useEffect(() => {
    if (!profile) {
      setRunners({});
      return;
    }
    refreshRunners();
    pollRef.current = setInterval(refreshRunners, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [profile?.id]);

  const startManualSession = async () => {
    if (!profile) return null;
    const { data } = await supabase.from('arbitrage_sessions').insert({ user_id: profile.id } as any).select().single();
    if (!data) return null;
    await refreshRunners();
    return data.id as string;
  };

  const startBotSession = async (botId: string) => {
    if (!profile) return null;

    // Empêche la création d'une session en double pour le même bot (ce qui
    // faisait qu'un bot "redémarrait tout seul" après un arrêt : une
    // deuxième session restait active en arrière-plan pendant qu'on en
    // arrêtait une autre).
    const existing = Object.values(runners).find((r) => r.botId === botId);
    if (existing) return existing.sessionId;

    const { data: activeRows } = await supabase
      .from('arbitrage_sessions' as any)
      .select('id')
      .eq('user_id', profile.id)
      .eq('bot_id', botId)
      .eq('is_active', true)
      .limit(1);
    if (activeRows && activeRows.length > 0) {
      await refreshRunners();
      return (activeRows[0] as any).id as string;
    }

    // Reprise après pause : on réactive la DERNIÈRE session existante du
    // bot (au lieu d'en créer une nouvelle vierge). Une nouvelle session
    // repart à 0 trade / 0 gain, ce qui donnait l'impression que les
    // stats étaient remises à zéro alors qu'elles restent en base — on
    // veut au contraire que trades/gains continuent où ils en étaient.
    const { data: lastSessionRows } = await supabase
      .from('arbitrage_sessions' as any)
      .select('id')
      .eq('user_id', profile.id)
      .eq('bot_id', botId)
      .order('start_time', { ascending: false })
      .limit(1);

    if (lastSessionRows && lastSessionRows.length > 0) {
      const sessionId = (lastSessionRows[0] as any).id as string;
      const { error } = await supabase
        .from('arbitrage_sessions' as any)
        .update({ is_active: true, end_time: null })
        .eq('id', sessionId);
      if (!error) {
        recentlyStoppedRef.current.delete(sessionId);
        await supabase.from('bot_logs' as any).insert({
          bot_id: botId, step: 'start',
          message: '▶️ Session de trading reprise. Recherche des opportunités d\'arbitrage...',
        });
        await refreshRunners();
        return sessionId;
      }
      // Si la réactivation échoue, on retombe sur la création d'une session.
    }

    const { data } = await supabase.from('arbitrage_sessions')
      .insert({ user_id: profile.id, bot_id: botId } as any).select().single();
    if (!data) return null;
    await supabase.from('bot_logs' as any).insert({
      bot_id: botId, step: 'start',
      message: "🚀 Session de trading démarrée. Recherche des premières opportunités d'arbitrage...",
    });
    await refreshRunners();
    return data.id as string;
  };

  const stopSession = async (sessionId: string) => {
    const runner = runners[sessionId];

    // Retrait optimiste immédiat de l'état local + marquage "grâce" pour
    // que le polling en cours (potentiellement en vol depuis avant le
    // clic) n'aille pas remettre cette session comme active juste après.
    recentlyStoppedRef.current.set(sessionId, Date.now());
    setRunners((r) => { const next = { ...r }; delete next[sessionId]; return next; });

    const { error } = await supabase
      .from('arbitrage_sessions')
      .update({ is_active: false, end_time: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      console.error('[stopSession] échec de la mise à jour Supabase:', error);
      // L'arrêt a échoué côté serveur : on annule le retrait optimiste
      // pour refléter la réalité plutôt que de laisser croire que le bot
      // est arrêté alors qu'il tourne toujours.
      recentlyStoppedRef.current.delete(sessionId);
      if (runner) setRunners((r) => ({ ...r, [sessionId]: runner }));
      return;
    }

    if (runner?.botId) {
      await supabase.from('bot_logs' as any).insert({ bot_id: runner.botId, step: 'stop', message: '⏹️ Session de trading arrêtée manuellement.' });
    }
  };

  // Arrête TOUTES les sessions actives d'un bot, pas seulement celle
  // suivie localement. Nécessaire car d'anciennes sessions en double ont
  // pu être créées avant le correctif anti-doublon de startBotSession :
  // si on n'arrête que la session connue côté client, l'autre session
  // (toujours "is_active = true" en base) continue d'être traitée par
  // process_arbitrage_tick côté serveur, et le bot réapparaît "ACTIF"
  // dès le prochain rafraîchissement (polling toutes les 4s).
  const stopBotSessions = async (botId: string) => {
    if (!profile) return;

    // Retrait optimiste de toutes les sessions locales liées à ce bot.
    const toStop = Object.values(runners).filter((r) => r.botId === botId);
    const now = Date.now();
    toStop.forEach((r) => recentlyStoppedRef.current.set(r.sessionId, now));
    setRunners((r) => {
      const next = { ...r };
      toStop.forEach((t) => delete next[t.sessionId]);
      return next;
    });

    // On récupère et arrête TOUTES les sessions actives en base pour ce
    // bot (y compris d'éventuels doublons non suivis localement).
    const { data: activeRows } = await supabase
      .from('arbitrage_sessions' as any)
      .select('id')
      .eq('user_id', profile.id)
      .eq('bot_id', botId)
      .eq('is_active', true);

    const ids = (activeRows || []).map((r: any) => r.id as string);
    ids.forEach((id) => recentlyStoppedRef.current.set(id, Date.now()));

    if (ids.length > 0) {
      const { error } = await supabase
        .from('arbitrage_sessions')
        .update({ is_active: false, end_time: new Date().toISOString() })
        .in('id', ids);

      if (error) {
        console.error('[stopBotSessions] échec de la mise à jour Supabase:', error);
        ids.forEach((id) => recentlyStoppedRef.current.delete(id));
        await refreshRunners();
        return;
      }

      await supabase.from('bot_logs' as any).insert({
        bot_id: botId, step: 'stop', message: '⏹️ Session de trading arrêtée manuellement.',
      });
    }

    await refreshRunners();
  };

  const isBotRunning = (botId: string) => Object.values(runners).some((r) => r.botId === botId);
  const getRunnerByBot = (botId: string) => Object.values(runners).find((r) => r.botId === botId);

  return (
    <TradingContext.Provider value={{ runners, startManualSession, stopSession, startBotSession, stopBotSessions, isBotRunning, getRunnerByBot, refreshRunners }}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error('useTrading must be used within a TradingProvider');
  return ctx;
}
