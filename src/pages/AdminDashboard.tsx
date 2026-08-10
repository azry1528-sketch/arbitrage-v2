import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, 
  LayoutDashboard, 
  Users, 
  Wallet, 
  ArrowDownCircle,
  ArrowUpCircle,
  
  LogOut,
  Menu,
  X,
  TrendingUp,
  AlertCircle,
  Check,
  XCircle,
  MessageCircle,
  BarChart3,
  ShieldCheck,
  ShieldQuestion,
  Eye
} from 'lucide-react';
import AdminAudit from './admin/AdminAudit';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Admin Overview
function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    activeInvestments: 0,
    totalBalance: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [
      { count: totalUsers },
      { data: deposits },
      { data: withdrawals },
      { count: activeInvestments },
      { data: profiles }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('deposits').select('amount, status'),
      supabase.from('withdrawals').select('amount, status'),
      supabase.from('investments').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('profiles').select('balance')
    ]);

    const totalDeposits = deposits?.reduce((acc, d) => acc + (d.status === 'approved' ? Number(d.amount) : 0), 0) || 0;
    const totalWithdrawals = withdrawals?.reduce((acc, w) => acc + (w.status === 'approved' ? Number(w.amount) : 0), 0) || 0;
    const pendingDeposits = deposits?.filter(d => d.status === 'pending').length || 0;
    const pendingWithdrawals = withdrawals?.filter(w => w.status === 'pending').length || 0;
    const totalBalance = profiles?.reduce((acc, p) => acc + Number(p.balance), 0) || 0;

    setStats({
      totalUsers: totalUsers || 0,
      totalDeposits,
      totalWithdrawals,
      pendingDeposits,
      pendingWithdrawals,
      activeInvestments: activeInvestments || 0,
      totalBalance
    });
  };

  const statCards = [
    { label: 'Utilisateurs', value: stats.totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Dépôts totaux', value: `$${stats.totalDeposits.toLocaleString()}`, icon: ArrowDownCircle, color: 'text-success' },
    { label: 'Retraits totaux', value: `$${stats.totalWithdrawals.toLocaleString()}`, icon: ArrowUpCircle, color: 'text-destructive' },
    { label: 'Dépôts en attente', value: stats.pendingDeposits, icon: AlertCircle, color: 'text-warning' },
    { label: 'Retraits en attente', value: stats.pendingWithdrawals, icon: AlertCircle, color: 'text-warning' },
    { label: 'Investissements actifs', value: stats.activeInvestments, icon: TrendingUp, color: 'text-accent' },
    { label: 'Balance totale', value: `$${stats.totalBalance.toLocaleString()}`, icon: Wallet, color: 'text-primary' },
    { label: 'Revenus plateforme', value: `$${(stats.totalDeposits - stats.totalWithdrawals).toLocaleString()}`, icon: BarChart3, color: 'text-success' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tableau de bord Admin</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground text-sm">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Users Management
function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: profs } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');
    const merged = (profs || []).map((p: any) => ({
      ...p,
      user_roles: (roles || []).filter((r: any) => r.user_id === p.user_id).map((r: any) => ({ role: r.role })),
    }));
    setUsers(merged);
    setLoading(false);
  };

  const toggleBlock = async (userId: string, currentStatus: boolean) => {
    await supabase
      .from('profiles')
      .update({ is_blocked: !currentStatus })
      .eq('id', userId);
    fetchUsers();
  };

  const toggleWithdrawalsBlock = async (userId: string, currentStatus: boolean) => {
    await supabase
      .from('profiles')
      .update({ withdrawals_blocked: !currentStatus })
      .eq('id', userId);
    fetchUsers();
  };

  const updateBalance = async (userId: string, newBalance: number) => {
    await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Utilisateur</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Email</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Solde</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Rôle</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-secondary/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs text-primary-foreground font-bold">
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <span className="font-medium">{user.full_name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={user.balance}
                      onChange={(e) => updateBalance(user.id, parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 rounded bg-input border border-border text-sm"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.user_roles?.[0]?.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground'
                    }`}>
                      {user.user_roles?.[0]?.role || 'user'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.is_blocked ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'
                      }`}>
                        {user.is_blocked ? 'Bloqué' : 'Actif'}
                      </span>
                      {user.withdrawals_blocked && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-warning/20 text-warning">
                          Retraits bloqués
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={user.is_blocked ? 'default' : 'destructive'}
                        onClick={() => toggleBlock(user.id, user.is_blocked)}
                      >
                        {user.is_blocked ? 'Débloquer' : 'Bloquer'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleWithdrawalsBlock(user.id, user.withdrawals_blocked)}
                      >
                        {user.withdrawals_blocked ? 'Autoriser retraits' : 'Bloquer retraits'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Deposits Management
function DepositsManagement() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    const { data } = await supabase
      .from('deposits')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false });
    setDeposits(data || []);
  };

  const updateAmount = async (depositId: string, newAmount: number) => {
    await supabase.from('deposits').update({ amount: newAmount }).eq('id', depositId);
    setDeposits((prev) => prev.map((d) => (d.id === depositId ? { ...d, amount: newAmount } : d)));
  };

  const updateStatus = async (depositId: string, status: 'approved' | 'rejected', userId: string, amount: number) => {
    const { error } = await supabase
      .from('deposits')
      .update({ status })
      .eq('id', depositId);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }

    if (status === 'approved') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ balance: Number(profile.balance) + amount })
          .eq('id', userId);
      }
      toast({ title: '✅ Dépôt approuvé', description: `$${amount.toLocaleString()} crédité. L'utilisateur a été notifié.` });
    } else {
      toast({ title: '❌ Dépôt rejeté' });
    }

    fetchDeposits();
  };


  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestion des dépôts</h2>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Utilisateur</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Montant</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deposits.map((deposit) => (
                <tr key={deposit.id} className="hover:bg-secondary/30 cursor-pointer" onClick={() => setSelectedDeposit(deposit)}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{deposit.profiles?.full_name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{deposit.profiles?.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      defaultValue={Number(deposit.amount)}
                      onBlur={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v) && v !== Number(deposit.amount)) updateAmount(deposit.id, v);
                      }}
                      className="w-28 px-2 py-1 rounded bg-input border border-border text-sm"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(deposit.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      deposit.status === 'approved' ? 'bg-success/20 text-success' :
                      deposit.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                      'bg-warning/20 text-warning'
                    }`}>
                      {deposit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    {deposit.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="btn-gold"
                          onClick={() => updateStatus(deposit.id, 'approved', deposit.user_id, Number(deposit.amount))}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatus(deposit.id, 'rejected', deposit.user_id, 0)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedDeposit} onOpenChange={(o) => !o && setSelectedDeposit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détail du dépôt</DialogTitle>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-2 text-sm">
              <DetailRow label="Utilisateur" value={selectedDeposit.profiles?.full_name || 'N/A'} />
              <DetailRow label="Email" value={selectedDeposit.profiles?.email} />
              <DetailRow label="Montant" value={`$${Number(selectedDeposit.amount).toLocaleString()}`} />
              <DetailRow label="Crypto" value={selectedDeposit.crypto_type || '-'} />
              <DetailRow label="Adresse wallet" value={selectedDeposit.wallet_address || '-'} mono />
              <DetailRow label="Hash de transaction" value={selectedDeposit.transaction_hash || '-'} mono />
              <DetailRow label="Statut" value={selectedDeposit.status} />
              <DetailRow label="ID transaction" value={selectedDeposit.id} mono />
              <DetailRow label="ID utilisateur" value={selectedDeposit.user_id} mono />
              <DetailRow label="Créé le" value={new Date(selectedDeposit.created_at).toLocaleString()} />
              <DetailRow label="Mis à jour le" value={selectedDeposit.updated_at ? new Date(selectedDeposit.updated_at).toLocaleString() : '-'} />
              <DetailRow label="Notes admin" value={selectedDeposit.admin_notes || '-'} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Petite ligne label / valeur pour les modales de détail (dépôts, retraits)
function DetailRow({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>{value ?? '-'}</span>
    </div>
  );
}

// KYC Management
function KYCManagement() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [tab, setTab] = useState('pending');
  const [reason, setReason] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, kyc_status, kyc_full_name, kyc_document_type, kyc_document_number, kyc_country, kyc_document_front_url, kyc_document_back_url, kyc_selfie_url, kyc_submitted_at, kyc_rejection_reason')
      .neq('kyc_status', 'not_submitted')
      .order('kyc_submitted_at', { ascending: false });
    setProfiles(data || []);
  };

  const getFileUrl = async (path: string | null) => {
    if (!path) return null;
    const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(path, 300);
    return data?.signedUrl || null;
  };

  const openFile = async (path: string | null) => {
    const url = await getFileUrl(path);
    if (url) window.open(url, '_blank');
    else toast({ title: 'Document introuvable', variant: 'destructive' });
  };

  const decide = async (profileId: string, status: 'approved' | 'rejected') => {
    const payload: any = { kyc_status: status };
    if (status === 'rejected') payload.kyc_rejection_reason = reason[profileId] || 'Documents non conformes';
    const { error } = await supabase.from('profiles').update(payload).eq('id', profileId);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: status === 'approved' ? '✅ KYC approuvé' : '❌ KYC rejeté' });
    fetchProfiles();
  };

  const filtered = profiles.filter(p => tab === 'all' ? true : p.kyc_status === tab);
  const counts = {
    all: profiles.length,
    pending: profiles.filter(p => p.kyc_status === 'pending').length,
    approved: profiles.filter(p => p.kyc_status === 'approved').length,
    rejected: profiles.filter(p => p.kyc_status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Vérification KYC</h2>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="all">Tous ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approuvés ({counts.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejetés ({counts.rejected})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Utilisateur</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Document</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Fichiers</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Soumis le</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/30">
                  <td className="px-6 py-4">
                    <div className="font-medium">{p.kyc_full_name || p.full_name || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">{p.email}</div>
                    <div className="text-xs text-muted-foreground">{p.kyc_document_type} • {p.kyc_document_number}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{p.kyc_country}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openFile(p.kyc_document_front_url)}><Eye className="w-3 h-3 mr-1" />Recto</Button>
                      {p.kyc_document_back_url && <Button size="sm" variant="outline" onClick={() => openFile(p.kyc_document_back_url)}><Eye className="w-3 h-3 mr-1" />Verso</Button>}
                      <Button size="sm" variant="outline" onClick={() => openFile(p.kyc_selfie_url)}><Eye className="w-3 h-3 mr-1" />Selfie</Button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {p.kyc_submitted_at ? new Date(p.kyc_submitted_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      p.kyc_status === 'approved' ? 'bg-success/20 text-success' :
                      p.kyc_status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                      'bg-warning/20 text-warning'
                    }`}>
                      {p.kyc_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {p.kyc_status === 'pending' && (
                      <div className="flex flex-col gap-2 min-w-[180px]">
                        <div className="flex gap-2">
                          <Button size="sm" className="btn-gold" onClick={() => decide(p.id, 'approved')}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => decide(p.id, 'rejected')}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                        <input
                          placeholder="Motif si rejet"
                          value={reason[p.id] || ''}
                          onChange={(e) => setReason((r) => ({ ...r, [p.id]: e.target.value }))}
                          className="px-2 py-1 rounded bg-input border border-border text-xs"
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">Aucun dossier</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Withdrawals Management
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

function WithdrawalsManagement() {
  const [tab, setTab] = useState('pending');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    const { data } = await supabase
      .from('withdrawals')
      .select('*, profiles(full_name, email, balance)')
      .order('created_at', { ascending: false });
    setWithdrawals(data || []);
  };

  const updateAmount = async (id: string, newAmount: number) => {
    await supabase.from('withdrawals').update({ amount: newAmount }).eq('id', id);
    setWithdrawals((prev) => prev.map((w) => (w.id === id ? { ...w, amount: newAmount } : w)));
  };

  const updateWallet = async (id: string, wallet: string) => {
    await supabase.from('withdrawals').update({ wallet_address: wallet }).eq('id', id);
    setWithdrawals((prev) => prev.map((w) => (w.id === id ? { ...w, wallet_address: wallet } : w)));
  };

  const updateStatus = async (withdrawalId: string, status: 'approved' | 'rejected', userId: string, amount: number) => {
    const { error } = await supabase
      .from('withdrawals')
      .update({ status })
      .eq('id', withdrawalId);

    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }

    if (status === 'approved') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ balance: Math.max(0, Number(profile.balance) - amount) })
          .eq('id', userId);
      }
      toast({ title: '✅ Retrait validé', description: `$${amount.toLocaleString()} envoyé. L'utilisateur a été notifié.` });
    } else {
      toast({ title: '❌ Retrait rejeté', description: `L'utilisateur a été notifié.` });
    }

    fetchWithdrawals();
  };


  const filtered = withdrawals.filter(w => {
    if (tab === 'all') return true;
    if (tab === 'success') return w.status === 'approved' || w.status === 'completed';
    return w.status === tab;
  });
  const counts = {
    all: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    success: withdrawals.filter(w => w.status === 'approved' || w.status === 'completed').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestion des retraits</h2>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="all">Tous ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({counts.pending})</TabsTrigger>
          <TabsTrigger value="success">Succès ({counts.success})</TabsTrigger>
          <TabsTrigger value="rejected">Rejeté ({counts.rejected})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Utilisateur</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Montant</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Wallet</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((withdrawal) => (
                <tr key={withdrawal.id} className="hover:bg-secondary/30 cursor-pointer" onClick={() => setSelectedWithdrawal(withdrawal)}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{withdrawal.profiles?.full_name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{withdrawal.profiles?.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      defaultValue={Number(withdrawal.amount)}
                      onBlur={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v) && v !== Number(withdrawal.amount)) updateAmount(withdrawal.id, v);
                      }}
                      className="w-28 px-2 py-1 rounded bg-input border border-border text-sm"
                    />
                  </td>
                  <td className="px-6 py-4 text-xs" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      defaultValue={withdrawal.wallet_address || ''}
                      onBlur={(e) => {
                        if (e.target.value !== withdrawal.wallet_address) updateWallet(withdrawal.id, e.target.value);
                      }}
                      className="w-48 px-2 py-1 rounded bg-input border border-border font-mono text-xs"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(withdrawal.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      withdrawal.status === 'approved' || withdrawal.status === 'completed' ? 'bg-success/20 text-success' :
                      withdrawal.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                      'bg-warning/20 text-warning'
                    }`}>
                      {withdrawal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    {withdrawal.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="btn-gold"
                          onClick={() => updateStatus(withdrawal.id, 'approved', withdrawal.user_id, Number(withdrawal.amount))}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatus(withdrawal.id, 'rejected', withdrawal.user_id, 0)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedWithdrawal} onOpenChange={(o) => !o && setSelectedWithdrawal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détail du retrait</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-2 text-sm">
              <DetailRow label="Utilisateur" value={selectedWithdrawal.profiles?.full_name || 'N/A'} />
              <DetailRow label="Email" value={selectedWithdrawal.profiles?.email} />
              <DetailRow label="Solde actuel" value={`$${Number(selectedWithdrawal.profiles?.balance || 0).toLocaleString()}`} />
              <DetailRow label="Montant demandé" value={`$${Number(selectedWithdrawal.amount).toLocaleString()}`} />
              <DetailRow label="Crypto" value={selectedWithdrawal.crypto_type || '-'} />
              <DetailRow label="Adresse wallet" value={selectedWithdrawal.wallet_address || '-'} mono />
              <DetailRow label="Statut" value={selectedWithdrawal.status} />
              <DetailRow label="ID transaction" value={selectedWithdrawal.id} mono />
              <DetailRow label="ID utilisateur" value={selectedWithdrawal.user_id} mono />
              <DetailRow label="Créé le" value={new Date(selectedWithdrawal.created_at).toLocaleString()} />
              <DetailRow label="Mis à jour le" value={selectedWithdrawal.updated_at ? new Date(selectedWithdrawal.updated_at).toLocaleString() : '-'} />
              <DetailRow label="Notes admin" value={selectedWithdrawal.admin_notes || '-'} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Support Tickets Management
function SupportManagement() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [response, setResponse] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false });
    setTickets(data || []);
  };

  const handleRespond = async () => {
    if (!selectedTicket || !response) return;

    await supabase
      .from('support_tickets')
      .update({ admin_response: response, status: 'closed' })
      .eq('id', selectedTicket.id);

    setSelectedTicket(null);
    setResponse('');
    fetchTickets();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Support</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4">Tickets</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`p-4 rounded-lg bg-secondary/30 cursor-pointer transition-all ${
                  selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{ticket.subject}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    ticket.status === 'closed' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">{ticket.profiles?.full_name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(ticket.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4">Répondre</h3>
          {selectedTicket ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="font-medium mb-2">{selectedTicket.subject}</div>
                <p className="text-muted-foreground">{selectedTicket.message}</p>
                <div className="text-xs text-muted-foreground mt-2">
                  De: {selectedTicket.profiles?.full_name} ({selectedTicket.profiles?.email})
                </div>
              </div>

              {selectedTicket.admin_response ? (
                <div className="p-4 rounded-lg bg-primary/10 border-l-2 border-primary">
                  <div className="text-sm font-medium text-primary mb-1">Réponse envoyée:</div>
                  <p>{selectedTicket.admin_response}</p>
                </div>
              ) : (
                <>
                  <textarea
                    placeholder="Votre réponse..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-input border border-border input-premium h-32 resize-none"
                  />
                  <Button className="w-full btn-gold" onClick={handleRespond}>
                    Envoyer la réponse
                  </Button>
                </>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">
              Sélectionnez un ticket pour répondre
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Admin Dashboard
export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Vue d\'ensemble' },
    { path: '/admin/users', icon: Users, label: 'Utilisateurs' },
    { path: '/admin/deposits', icon: ArrowDownCircle, label: 'Dépôts' },
    { path: '/admin/withdrawals', icon: ArrowUpCircle, label: 'Retraits' },
    { path: '/admin/kyc', icon: ShieldQuestion, label: 'KYC' },
    { path: '/admin/support', icon: MessageCircle, label: 'Support' },
    { path: '/admin/audit', icon: ShieldCheck, label: 'Audit rôles' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <NavLink to="/" className="flex items-center gap-2">
              <Zap className="w-8 h-8 text-primary" />
              <span className="text-xl font-serif font-bold text-gradient-gold">Admin</span>
            </NavLink>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                A
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">Admin</div>
                <div className="text-xs text-muted-foreground truncate">{profile?.email}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-6 h-16">
            <button
              className="lg:hidden p-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="ml-auto">
              <span className="px-3 py-1 rounded-full bg-destructive/20 text-destructive text-sm font-medium">
                Mode Admin
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Routes>
            <Route path="/" element={<AdminOverview />} />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="/deposits" element={<DepositsManagement />} />
            <Route path="/withdrawals" element={<WithdrawalsManagement />} />
            <Route path="/kyc" element={<KYCManagement />} />
            <Route path="/support" element={<SupportManagement />} />
            <Route path="/audit" element={<AdminAudit />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
