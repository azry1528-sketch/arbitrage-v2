import { useEffect, useState } from 'react';
import { Megaphone, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('announcements' as any)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems((data as any) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="w-6 h-6 text-primary" /> Annonces</h2>
        <p className="text-sm text-muted-foreground">Toutes les annonces publiées par l'équipe ArbiFlow</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Chargement des annonces...
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-10 text-center text-muted-foreground text-sm">
          Aucune annonce pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 10) * 0.03 }}
              className="glass-card p-4 md:p-5"
            >
              <div className="font-semibold">{a.title}</div>
              <p className="text-sm text-muted-foreground mt-1.5 whitespace-pre-line">{a.message}</p>
              <div className="text-[11px] text-muted-foreground mt-2">{new Date(a.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
