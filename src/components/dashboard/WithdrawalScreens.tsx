import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Copy, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// =====================================================================
// 3 écrans de retrait inspirés de Binance :
//   - WithdrawalProcessingScreen : affiché juste après la demande de retrait
//   - WithdrawalSuccessScreen    : affiché à l'entrée sur le site une fois le retrait validé
//   - WithdrawalDetailsPage      : détails d'un retrait (route /dashboard/withdrawals/:id)
// =====================================================================

// Délai annoncé à l'utilisateur pour le traitement (heure estimée = création + ETA).
const ETA_HOURS = 24;

const SUCCESS_STATUSES = ['approved', 'completed'];

export interface WithdrawalRow {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | null;
  crypto_type: string | null;
  wallet_address: string;
  created_at: string | null;
  updated_at: string | null;
  admin_notes: string | null;
}

const NETWORKS: Record<string, string> = {
  'USDT-TRC20': 'TRX',
  'USDT-ERC20': 'ETH',
  'USDC-ERC20': 'ETH',
  BTC: 'BTC',
  ETH: 'ETH',
  BNB: 'BSC',
  SOL: 'SOL',
};

export function getNetwork(cryptoType: string | null) {
  return (cryptoType && NETWORKS[cryptoType]) || cryptoType || '-';
}

// Les montants sont saisis en USD ; pour les stablecoins on affiche directement USDT / USDC.
export function getUnit(cryptoType: string | null) {
  const coin = (cryptoType || 'USDT').split('-')[0];
  return coin === 'USDT' || coin === 'USDC' ? coin : 'USD';
}

export function formatAmount(n: number) {
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 8 });
}

export function formatDateTime(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function estimatedCompletion(w: Pick<WithdrawalRow, 'created_at'>) {
  const start = w.created_at ? new Date(w.created_at) : new Date();
  return new Date(start.getTime() + ETA_HOURS * 3_600_000);
}

export function isSuccess(status: string | null | undefined) {
  return !!status && SUCCESS_STATUSES.includes(status);
}

function useWithdrawal(id: string | undefined) {
  const { profile } = useAuth();
  const [w, setW] = useState<WithdrawalRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !profile?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('id', id)
        .eq('user_id', profile.id)
        .maybeSingle();
      if (!cancelled) {
        setW((data as WithdrawalRow) || null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, profile?.id]);

  return { w, loading };
}

// ---------------------------------------------------------------------
// Enveloppe plein écran (fond sombre type Binance)
// ---------------------------------------------------------------------
function FullScreen({ children, onBack, title }: { children: React.ReactNode; onBack?: () => void; title?: string }) {
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#1a2233] text-white overflow-y-auto">
      {onBack && (
        <div className="relative flex items-center justify-center h-14 shrink-0">
          <button onClick={onBack} className="absolute left-0 p-4" aria-label="Retour">
            <ArrowLeft className="w-6 h-6" />
          </button>
          {title && <h1 className="text-base font-semibold">{title}</h1>}
        </div>
      )}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}

function Hourglass() {
  return (
    <svg width="84" height="110" viewBox="0 0 84 110" aria-hidden="true">
      <rect x="10" y="4" width="64" height="9" rx="1" fill="#4a5163" />
      <rect x="10" y="97" width="64" height="9" rx="1" fill="#4a5163" />
      <path d="M16 13h52c0 22-14 32-20 42 6 10 20 20 20 42H16c0-22 14-32 20-42-6-10-20-20-20-42z" fill="#2c3345" />
      <path d="M33 33h18l-9 12z" fill="#FCD535" />
      <path d="M26 92c3-14 10-20 16-26 6 6 13 12 16 26z" fill="#FCD535" />
    </svg>
  );
}

// ---------------------------------------------------------------------
// 1) Withdrawal Processing
// ---------------------------------------------------------------------
export function WithdrawalProcessingScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { w, loading } = useWithdrawal(id);

  if (loading) return <FullScreen><div className="m-auto text-sm text-white/60">Chargement…</div></FullScreen>;
  if (!w) return <Navigate to="/dashboard/wallet?tab=retrait" replace />;

  return (
    <FullScreen>
      <div className="flex-1 flex flex-col items-center px-6 pt-24 text-center">
        <Hourglass />
        <h1 className="mt-14 text-lg font-semibold">Retrait en cours</h1>
        <div className="mt-5 text-4xl font-bold tracking-tight">
          {formatAmount(w.amount)} {getUnit(w.crypto_type)}
        </div>
        <p className="mt-6 text-sm text-white/55 leading-relaxed max-w-xs">
          Heure estimée de traitement : {formatDateTime(estimatedCompletion(w))}
          <br />
          Vous serez notifié une fois le retrait terminé.
          <br />
          Consultez l'historique pour les dernières mises à jour.
        </p>
      </div>
      <div className="p-4 pb-8 space-y-3">
        <button
          onClick={() => navigate(`/dashboard/withdrawals/${w.id}`)}
          className="w-full py-3.5 rounded-md bg-[#FCD535] text-[#1a2233] font-semibold"
        >
          Voir les détails
        </button>
        <button
          onClick={() => navigate('/dashboard/wallet?tab=retrait')}
          className="w-full py-3.5 rounded-md bg-white/10 text-white font-semibold"
        >
          Voir l'historique
        </button>
      </div>
    </FullScreen>
  );
}

// ---------------------------------------------------------------------
// 2) Withdrawal Successful (contenu partagé : route + passerelle d'entrée)
// ---------------------------------------------------------------------
function SuccessContent({
  w,
  onDetails,
  onClose,
}: {
  w: WithdrawalRow;
  onDetails: () => void;
  onClose: () => void;
}) {
  return (
    <FullScreen>
      <button onClick={onClose} className="p-4 w-fit" aria-label="Fermer">
        <X className="w-6 h-6" />
      </button>
      <div className="flex-1 flex flex-col items-center px-6 pt-16 text-center">
        <div className="w-28 h-28 rounded-full bg-[#02c076]/20 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-[#02c076] flex items-center justify-center">
            <Check className="w-10 h-10 text-white" strokeWidth={3.5} />
          </div>
        </div>
        <h1 className="mt-12 text-lg font-semibold">Retrait réussi</h1>
        <div className="mt-5 text-4xl font-bold tracking-tight">
          {formatAmount(w.amount)} {getUnit(w.crypto_type)}
        </div>
        <p className="mt-6 text-sm text-white/55 leading-relaxed max-w-xs">
          Les fonds ont été envoyés. Rapprochez-vous de la plateforme de destination pour le reçu de votre transaction.
        </p>
      </div>
      <div className="p-4 pb-8 space-y-3">
        <button onClick={onDetails} className="w-full py-3.5 rounded-md bg-[#FCD535] text-[#1a2233] font-semibold">
          Voir les détails
        </button>
        <button onClick={onClose} className="w-full py-3.5 rounded-md bg-white/10 text-white font-semibold">
          Fermer
        </button>
      </div>
    </FullScreen>
  );
}

export function WithdrawalSuccessScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { w, loading } = useWithdrawal(id);
  if (loading) return <FullScreen><div className="m-auto text-sm text-white/60">Chargement…</div></FullScreen>;
  if (!w) return <Navigate to="/dashboard/wallet?tab=retrait" replace />;
  return (
    <SuccessContent
      w={w}
      onDetails={() => navigate(`/dashboard/withdrawals/${w.id}`)}
      onClose={() => navigate('/dashboard/wallet?tab=retrait')}
    />
  );
}

// ---------------------------------------------------------------------
// Passerelle : à l'entrée sur le site, montre « Retrait réussi » une seule fois
// par retrait validé (récent) que l'utilisateur n'a pas encore vu.
// ---------------------------------------------------------------------
const SEEN_WINDOW_DAYS = 7;
const seenKey = (profileId: string) => `covs_seen_withdrawals_${profileId}`;

function readSeen(profileId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(seenKey(profileId)) || '[]');
  } catch {
    return [];
  }
}
function writeSeen(profileId: string, ids: string[]) {
  try {
    localStorage.setItem(seenKey(profileId), JSON.stringify(ids.slice(-200)));
  } catch {
    /* stockage indisponible : on réaffichera au prochain chargement */
  }
}

export function WithdrawalSuccessGate() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<WithdrawalRow[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - SEEN_WINDOW_DAYS * 86_400_000).toISOString();
      const { data } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', profile.id)
        .in('status', SUCCESS_STATUSES as any)
        .gte('updated_at', since)
        .order('updated_at', { ascending: true });
      if (cancelled) return;
      const seen = new Set(readSeen(profile.id));
      setQueue(((data as WithdrawalRow[]) || []).filter((w) => !seen.has(w.id)));
    })();
    return () => { cancelled = true; };
  }, [profile?.id]);

  const current = queue[0];
  if (!current || !profile?.id) return null;

  const markSeen = () => {
    writeSeen(profile.id, [...readSeen(profile.id), current.id]);
    setQueue((q) => q.slice(1));
  };

  return (
    <SuccessContent
      w={current}
      onClose={markSeen}
      onDetails={() => {
        markSeen();
        navigate(`/dashboard/withdrawals/${current.id}`);
      }}
    />
  );
}

// ---------------------------------------------------------------------
// 3) Withdrawal Details
// ---------------------------------------------------------------------
function Row({ label, value, mono, copy }: { label: string; value: React.ReactNode; mono?: boolean; copy?: string }) {
  const { toast } = useToast();
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <span className="text-sm text-white/50 shrink-0">{label}</span>
      <span className={`text-sm text-right break-all flex items-start gap-2 ${mono ? 'font-mono' : ''}`}>
        {value}
        {copy && (
          <button
            aria-label="Copier"
            onClick={() => {
              navigator.clipboard?.writeText(copy).then(() => toast({ title: 'Copié' })).catch(() => {});
            }}
            className="text-white/50 hover:text-white mt-0.5"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
      </span>
    </div>
  );
}

export function WithdrawalDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { w, loading } = useWithdrawal(id);

  if (loading) return <FullScreen onBack={() => navigate('/dashboard/wallet?tab=retrait')} title="Détails du retrait"><div className="m-auto text-sm text-white/60">Chargement…</div></FullScreen>;
  if (!w) {
    return (
      <FullScreen onBack={() => navigate('/dashboard/wallet?tab=retrait')} title="Détails du retrait">
        <div className="m-auto text-sm text-white/60">Retrait introuvable.</div>
      </FullScreen>
    );
  }

  const success = isSuccess(w.status);
  const rejected = w.status === 'rejected';
  const unit = getUnit(w.crypto_type);

  return (
    <FullScreen onBack={() => navigate('/dashboard/wallet?tab=retrait')} title="Détails du retrait">
      <div className="px-6 pb-10 pt-6">
        <div className="text-center">
          <div className="text-3xl font-bold">-{formatAmount(w.amount)} {unit}</div>
          <div
            className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium ${
              success ? 'text-[#02c076]' : rejected ? 'text-[#f6465d]' : 'text-white'
            }`}
          >
            {success ? <Check className="w-4 h-4" /> : rejected ? <X className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            {success ? 'Terminé' : rejected ? 'Rejeté' : 'En cours'}
          </div>
          {!success && !rejected && (
            <p className="mt-3 text-xs text-white/50 leading-relaxed">
              Heure estimée : {formatDateTime(estimatedCompletion(w))}
              <br />
              Vous serez notifié une fois le retrait terminé.
            </p>
          )}
        </div>

        <div className="mt-10 divide-y divide-white/5">
          <Row label="Réseau" value={<span className="px-2 py-0.5 rounded bg-[#FCD535]/15 text-[#FCD535] text-xs">{getNetwork(w.crypto_type)}</span>} />
          <Row label="Adresse" value={w.wallet_address} mono copy={w.wallet_address} />
          <Row label="Référence" value={w.id.slice(0, 8).toUpperCase()} mono copy={w.id} />
          <Row label="Montant" value={`${formatAmount(w.amount)} ${unit}`} />
          <Row label="Frais de réseau" value={`0.00000000 ${unit}`} />
          <Row label="Portefeuille" value="Portefeuille principal" />
          <Row label="Date" value={w.created_at ? formatDateTime(new Date(w.created_at)) : '-'} />
          {success && w.updated_at && <Row label="Terminé le" value={formatDateTime(new Date(w.updated_at))} />}
        </div>
      </div>
    </FullScreen>
  );
}
