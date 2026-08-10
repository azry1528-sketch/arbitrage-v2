import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Nombre de bots actifs + profit qu'ils ont généré aujourd'hui — calculé à
// partir des vraies tables bots / arbitrage_sessions / arbitrage_trades,
// pas de donnée fictive.
export function ActiveBotsWidget() {
  const { profile } = useAuth();
  const [activeCount, setActiveCount] = useState(0);
  const [todayProfit, setTodayProfit] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      const { data: bots } = await supabase
        .from('bots' as any)
        .select('id, status')
        .eq('user_id', profile.id);

      const botList = (bots as any) || [];
      setActiveCount(botList.filter((b: any) => b.status === 'active').length);

      const botIds = botList.map((b: any) => b.id);
      if (botIds.length > 0) {
        const { data: sessions } = await supabase
          .from('arbitrage_sessions' as any)
          .select('id')
          .in('bot_id', botIds);
        const sessionIds = ((sessions as any) || []).map((s: any) => s.id);

        if (sessionIds.length > 0) {
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          const { data: trades } = await supabase
            .from('arbitrage_trades' as any)
            .select('profit, executed_at')
            .in('session_id', sessionIds)
            .gte('executed_at', startOfDay.toISOString());
          const sum = ((trades as any) || []).reduce((acc: number, t: any) => acc + Number(t.profit || 0), 0);
          setTodayProfit(sum);
        }
      }
      setLoading(false);
    })();
  }, [profile?.id]);

  if (loading) return null;

  return (
    <Link to="/dashboard/trade?tab=automatique"
      className="flex-1 flex flex-col justify-center gap-4 rounded-[20px] px-5 py-6 bg-card border border-border/60 transition-colors duration-200 hover:border-primary/40">
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
      <div>
        <div className="text-2xl font-bold font-mono tracking-tight">{activeCount}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          bot{activeCount > 1 ? 's' : ''} actif{activeCount > 1 ? 's' : ''}
        </div>
      </div>
      <div className={`text-sm font-semibold font-mono ${todayProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
        {todayProfit >= 0 ? '+' : ''}${todayProfit.toFixed(2)}
        <span className="text-muted-foreground font-normal text-xs ml-1">aujourd'hui</span>
      </div>
    </Link>
  );
}
