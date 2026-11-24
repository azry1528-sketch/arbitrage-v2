import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Fiche utilisateur côté admin : toutes les infos du profil, modifiables,
// avec un seul bouton « Enregistrer » (seuls les champs modifiés sont envoyés).

interface Props {
  user: any | null;
  onClose: () => void;
  onSaved: () => void;
}

type FieldType = 'text' | 'number' | 'bool' | 'select';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  mono?: boolean;
  hint?: string;
}

const KYC_OPTIONS = [
  { value: 'not_submitted', label: 'Non soumis' },
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvé' },
  { value: 'rejected', label: 'Rejeté' },
];

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: 'Identité',
    fields: [
      { key: 'full_name', label: 'Nom complet', type: 'text' },
      { key: 'phone', label: 'Téléphone', type: 'text' },
      { key: 'referral_code', label: 'Code de parrainage', type: 'text', mono: true },
    ],
  },
  {
    title: 'Finances',
    fields: [
      { key: 'balance', label: 'Solde ($)', type: 'number' },
      { key: 'total_earnings', label: 'Gains totaux ($)', type: 'number' },
      { key: 'withdrawal_address', label: 'Adresse de retrait par défaut', type: 'text', mono: true },
      { key: 'withdrawal_password', label: 'Mot de passe de retrait', type: 'text', mono: true },
    ],
  },
  {
    title: 'KYC',
    fields: [
      { key: 'kyc_status', label: 'Statut KYC', type: 'select', options: KYC_OPTIONS },
      { key: 'kyc_full_name', label: 'Nom (KYC)', type: 'text' },
      { key: 'kyc_document_type', label: 'Type de document', type: 'text' },
      { key: 'kyc_document_number', label: 'N° de document', type: 'text', mono: true },
      { key: 'kyc_country', label: 'Pays', type: 'text' },
      { key: 'kyc_rejection_reason', label: 'Motif de rejet', type: 'text' },
    ],
  },
  {
    title: 'Accès',
    fields: [
      { key: 'is_blocked', label: 'Compte bloqué', type: 'bool' },
      { key: 'withdrawals_blocked', label: 'Retraits bloqués', type: 'bool' },
    ],
  },
];

const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);
const inputCls = 'w-full px-3 py-2 rounded bg-input border border-border text-sm';

function toForm(user: any): Record<string, any> {
  const f: Record<string, any> = {};
  for (const d of ALL_FIELDS) {
    const v = user?.[d.key];
    f[d.key] = d.type === 'bool' ? !!v : v === null || v === undefined ? '' : String(v);
  }
  f.__role = user?.user_roles?.[0]?.role || 'user';
  return f;
}

export function UserDetailDialog({ user, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const { user: me } = useAuth();
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<{ dCount: number; dTotal: number; wCount: number; wTotal: number; referrals: number } | null>(null);
  const [referrer, setReferrer] = useState<string>('-');

  useEffect(() => {
    if (!user) return;
    setForm(toForm(user));
    setStats(null);
    setReferrer('-');
    let cancelled = false;
    (async () => {
      const [{ data: deps }, { data: wds }, { count: referrals }, ref] = await Promise.all([
        supabase.from('deposits').select('amount, status').eq('user_id', user.id),
        supabase.from('withdrawals').select('amount, status').eq('user_id', user.id),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('referred_by', user.id),
        user.referred_by
          ? supabase.from('profiles').select('full_name, email').eq('id', user.referred_by).maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      if (cancelled) return;
      const ok = (s: string) => s === 'approved' || s === 'completed';
      const d = (deps as any[]) || [];
      const w = (wds as any[]) || [];
      setStats({
        dCount: d.length,
        dTotal: d.filter((x) => ok(x.status)).reduce((a, x) => a + Number(x.amount || 0), 0),
        wCount: w.length,
        wTotal: w.filter((x) => ok(x.status)).reduce((a, x) => a + Number(x.amount || 0), 0),
        referrals: referrals || 0,
      });
      if (ref?.data) setReferrer(ref.data.full_name || ref.data.email || '-');
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const original = useMemo(() => (user ? toForm(user) : {}), [user]);
  const dirty = ALL_FIELDS.some((d) => form[d.key] !== original[d.key]) || form.__role !== original.__role;
  const isSelf = !!me && user?.user_id === me.id;

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!user) return;
    const payload: Record<string, any> = {};
    for (const d of ALL_FIELDS) {
      if (form[d.key] === original[d.key]) continue;
      if (d.type === 'number') {
        const n = parseFloat(String(form[d.key]).replace(',', '.'));
        if (isNaN(n)) {
          toast({ title: 'Valeur invalide', description: `${d.label} doit être un nombre.`, variant: 'destructive' });
          return;
        }
        payload[d.key] = n;
      } else if (d.type === 'bool') {
        payload[d.key] = !!form[d.key];
      } else {
        const v = String(form[d.key]).trim();
        payload[d.key] = v === '' ? null : v;
      }
    }

    setSaving(true);
    try {
      if (Object.keys(payload).length > 0) {
        const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
        if (error) throw error;
      }

      if (form.__role !== original.__role) {
        if (isSelf) {
          toast({ title: 'Action refusée', description: 'Vous ne pouvez pas modifier votre propre rôle.', variant: 'destructive' });
        } else {
          const { error: delErr } = await supabase.from('user_roles').delete().eq('user_id', user.user_id);
          if (delErr) throw delErr;
          const { error: insErr } = await supabase.from('user_roles').insert({ user_id: user.user_id, role: form.__role });
          if (insErr) throw insErr;
        }
      }

      toast({ title: '✅ Utilisateur mis à jour' });
      onSaved();
      onClose();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message || 'Enregistrement impossible', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fiche utilisateur</DialogTitle>
        </DialogHeader>

        {user && (
          <div className="space-y-6">
            {/* Lecture seule */}
            <div className="p-4 rounded-lg bg-secondary/30 space-y-1.5 text-sm">
              <ReadRow label="Email" value={user.email} />
              <ReadRow label="ID profil" value={user.id} mono />
              <ReadRow label="ID auth" value={user.user_id} mono />
              <ReadRow label="Inscrit le" value={user.created_at ? new Date(user.created_at).toLocaleString() : '-'} />
              <ReadRow label="Parrainé par" value={referrer} />
              {stats && (
                <>
                  <ReadRow label="Dépôts" value={`${stats.dCount} • validés : ${money(stats.dTotal)}`} />
                  <ReadRow label="Retraits" value={`${stats.wCount} • validés : ${money(stats.wTotal)}`} />
                  <ReadRow label="Filleuls" value={stats.referrals} />
                </>
              )}
              <p className="text-[11px] text-muted-foreground pt-1">
                L'email est lié au compte d'authentification : il n'est pas modifiable ici.
              </p>
            </div>

            {/* Rôle */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Rôle</h4>
              <select
                value={form.__role || 'user'}
                onChange={(e) => set('__role', e.target.value)}
                disabled={isSelf}
                className={inputCls}
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </select>
              {isSelf && <p className="text-[11px] text-muted-foreground mt-1">Vous ne pouvez pas modifier votre propre rôle.</p>}
            </div>

            {/* Champs éditables */}
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-semibold mb-2">{section.title}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {section.fields.map((d) => (
                    <label key={d.key} className={`block ${d.type === 'bool' ? 'flex items-center gap-2 pt-5' : ''}`}>
                      {d.type === 'bool' ? (
                        <>
                          <input
                            type="checkbox"
                            checked={!!form[d.key]}
                            onChange={(e) => set(d.key, e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{d.label}</span>
                        </>
                      ) : (
                        <>
                          <span className="block text-xs text-muted-foreground mb-1">{d.label}</span>
                          {d.type === 'select' ? (
                            <select value={form[d.key] ?? ''} onChange={(e) => set(d.key, e.target.value)} className={inputCls}>
                              {d.options!.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              inputMode={d.type === 'number' ? 'decimal' : undefined}
                              autoComplete="off"
                              value={form[d.key] ?? ''}
                              onChange={(e) => set(d.key, e.target.value)}
                              className={`${inputCls} ${d.mono ? 'font-mono text-xs' : ''}`}
                            />
                          )}
                        </>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-background/90 backdrop-blur py-3 -mx-1 px-1">
              <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
              <Button className="btn-gold" onClick={save} disabled={saving || !dirty}>
                {saving ? '...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReadRow({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>{value ?? '-'}</span>
    </div>
  );
}
