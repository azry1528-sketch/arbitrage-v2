import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

// Sparkline compacte de l'évolution du solde sur 7 jours — alimentée par
// les vrais snapshots quotidiens (table daily_snapshots), avec un
// secours synthétique si l'historique est encore trop court.
export function BalanceSparkline() {
  const { profile } = useAuth();
  const [data, setData] = useState<{ v: number }[]>([]);
  const [positive, setPositive] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      const { data: snaps } = await supabase
        .from('daily_snapshots' as any)
        .select('*')
        .eq('user_id', profile.id)
        .order('snapshot_date', { ascending: true })
        .limit(7);

      let rows = ((snaps as any) || []).map((s: any) => ({ v: Number(s.balance) }));

      if (rows.length < 2) {
        const balance = Number(profile.balance || 0);
        rows = Array.from({ length: 7 }, (_, i) => ({ v: Number((balance * (0.85 + (i / 6) * 0.15)).toFixed(2)) }));
      }

      setData(rows);
      setPositive(rows[rows.length - 1].v >= rows[0].v);
    })();
  }, [profile?.id, profile?.balance]);

  if (data.length === 0) return <div className="w-32 h-12" />;

  const color = positive ? 'hsl(var(--success))' : 'hsl(var(--destructive))';

  return (
    <div className="w-32 h-12 md:w-40 md:h-14">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill="url(#sparklineFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
