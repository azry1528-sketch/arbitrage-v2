import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PopupButton } from '@/components/ui/popup';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CovsBanner } from '@/components/brand/CovsToken';
import { COVS_INFO_URL } from '@/lib/brand';

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export function AnnouncementsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDontShowAgain(false);
    supabase
      .from('announcements' as any)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setItems((data as any) || []));
  }, [open]);

  const handleClose = async () => {
    if (dontShowAgain && profile) {
      await supabase.from('profiles').update({ hide_announcements_popup: true } as any).eq('id', profile.id);
    }
    onClose();
  };

  if (open && items.length === 0) {
    // Rien à afficher : on ferme silencieusement plutôt que de montrer une popup vide.
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Dernières annonces</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          <CovsBanner to={COVS_INFO_URL} cta="En savoir plus" compact className="!rounded-lg !px-3 !py-3" />
          {items.map((a) => (
            <div key={a.id} className="p-3 rounded-xl bg-secondary/50">
              <div className="font-semibold text-sm">{a.title}</div>
              <p className="text-[13px] text-muted-foreground mt-0.5">{a.message}</p>
              <div className="text-[10px] text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString('fr-FR')}</div>
            </div>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            className="rounded border-border"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />
          Ne plus afficher cette popup à la connexion
        </label>
        <PopupButton onClick={handleClose}>Compris</PopupButton>
      </DialogContent>
    </Dialog>
  );
}
