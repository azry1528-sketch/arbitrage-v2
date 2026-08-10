import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, ShieldAlert, Search, UserCog } from 'lucide-react';

interface AuditResult {
  profile: { id: string; user_id: string; email: string | null; full_name: string | null } | null;
  role: string | null;
}

export default function AdminAudit() {
  const [email, setEmail] = useState('tchapmoguy@gmail.com');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const { toast } = useToast();

  const runAudit = async (target = email) => {
    setLoading(true);
    setResult(null);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, user_id, email, full_name')
      .ilike('email', target.trim())
      .maybeSingle();

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (!profile) {
      setResult({ profile: null, role: null });
      setLoading(false);
      return;
    }

    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.user_id)
      .maybeSingle();

    setResult({ profile, role: roleRow?.role ?? null });
    setLoading(false);
  };

  useEffect(() => {
    runAudit('tchapmoguy@gmail.com');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const promote = async () => {
    if (!result?.profile) return;
    setActing(true);
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: result.profile.user_id, role: 'admin' });
    setActing(false);
    if (error) {
      toast({ title: 'Échec promotion', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '✅ Rôle admin attribué', description: result.profile.email ?? '' });
    runAudit(result.profile.email ?? email);
  };

  const demote = async () => {
    if (!result?.profile) return;
    setActing(true);
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', result.profile.user_id)
      .eq('role', 'admin');
    setActing(false);
    if (error) {
      toast({ title: 'Échec', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Rôle admin retiré' });
    runAudit(result.profile.email ?? email);
  };

  const isAdmin = result?.role === 'admin';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UserCog className="w-6 h-6 text-primary" /> Audit des rôles
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Vérifiez le rôle d'un compte et corrigez la configuration si besoin.
        </p>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex gap-2">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemple.com"
            onKeyDown={(e) => e.key === 'Enter' && runAudit()}
          />
          <Button onClick={() => runAudit()} disabled={loading} className="btn-gold">
            <Search className="w-4 h-4 mr-2" /> Auditer
          </Button>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Recherche en cours…</p>}

        {result && !result.profile && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
            Aucun profil trouvé pour <strong>{email}</strong>. L'utilisateur doit d'abord s'inscrire.
          </div>
        )}

        {result?.profile && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/40">
              <div>
                <div className="text-xs text-muted-foreground">Nom</div>
                <div className="font-medium">{result.profile.full_name || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="font-medium">{result.profile.email}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">User ID</div>
                <div className="font-mono text-xs break-all">{result.profile.user_id}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Rôle actuel</div>
                <div className="font-medium">{result.role ?? 'user (aucun rôle explicite)'}</div>
              </div>
            </div>

            <div
              className={`flex items-center gap-3 p-4 rounded-lg border ${
                isAdmin
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-warning/10 border-warning/30 text-warning'
              }`}
            >
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              <span className="text-sm">
                {isAdmin
                  ? 'Ce compte a bien le rôle admin.'
                  : "Ce compte n'est pas administrateur. Vous pouvez le promouvoir ci-dessous."}
              </span>
            </div>

            <div className="flex gap-2">
              {!isAdmin ? (
                <Button onClick={promote} disabled={acting} className="btn-gold">
                  Promouvoir en admin
                </Button>
              ) : (
                <Button onClick={demote} disabled={acting} variant="destructive">
                  Retirer le rôle admin
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
