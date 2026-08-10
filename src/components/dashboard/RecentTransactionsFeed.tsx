import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownCircle, ArrowUpCircle, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Tx {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: string;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diffMs / 3_600_000);
  if (h < 1) return `il y a ${Math.max(1, Math.floor(diffMs / 60_000))} min`;
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

const STATUS_LABEL: Record<string, { l: string; cls: string }> = {
  pending: { l: 'En attente', cls: 'bg-warning/15 text-warning' },
  approved: { l: 'Succès', cls: 'bg-success/15 text-success' },
  completed: { l: 'Succès', cls: 'bg-success/15 text-success' },
  rejected: { l: 'Rejeté', cls: 'bg-destructive/15 text-destructive' },
};

// Dernières transactions réelles (dépôts + retraits fusionnés) — pas de
// données fictives, tout vient des tables deposits / withdrawals.
export function RecentTransactionsFeed() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      const [{ data: deposits }, { data: withdrawals }] = await Promise.all([
        supabase.from('deposits').select('id, amount, status, created_at').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(4),
        supabase.from('withdrawals').select('id, amount, status, created_at').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(4),
      ]);

      const merged: Tx[] = [
        ...((deposits as any) || []).map((d: any) => ({ ...d, type: 'deposit' as const })),
        ...((withdrawals as any) || []).map((w: any) => ({ ...w, type: 'withdrawal' as const })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);

      setItems(merged);
      setLoading(false);
    })();
  }, [profile?.id]);

  if (loading || items.length === 0) return null;

  return (
    <div className="h-full flex flex-col rounded-[20px] p-5 md:p-6 bg-card border border-border/60">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-base">Dernières transactions</h3>
        <Link to="/dashboard/portfolio" className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors duration-200">
          Voir tout <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {/* flex-1 + justify-around pour répartir les lignes sur toute la hauteur
          disponible, quel que soit le nombre de transactions, et ainsi égaler
          la hauteur de la carte "Prix crypto en direct" à côté */}
      <div className="flex-1 flex flex-col justify-around divide-y divide-border/40">
        {items.map((tx) => {
          const status = STATUS_LABEL[tx.status] || STATUS_LABEL.pending;
          const isDeposit = tx.type === 'deposit';
          return (
            <div key={`${tx.type}-${tx.id}`} className="flex items-center gap-3 py-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDeposit ? 'bg-success/10' : 'bg-secondary'}`}>
                {isDeposit ? <ArrowDownCircle className="w-4 h-4 text-success" /> : <ArrowUpCircle className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{isDeposit ? 'Dépôt' : 'Retrait'}</div>
                <div className="text-[11px] text-muted-foreground">{timeAgo(tx.created_at)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{isDeposit ? '+' : '-'}${Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${status.cls}`}>{status.l}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
