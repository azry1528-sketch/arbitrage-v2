import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export function Announcements({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('announcements' as any)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        setItems((data as any) || []);
        setLoading(false);
      });
  }, []);

  if (!loading && items.length === 0) return null;
  if (loading) return null;

  // Carte pleine hauteur — même gabarit que le widget bots actifs juste
  // au-dessus, pour que les deux ensemble égalent la hauteur de la carte
  // solde à côté.
  if (compact) {
    const a = items[0];
    return (
      <Link to="/dashboard/announcements"
        className="flex-1 flex flex-col justify-center gap-4 rounded-[20px] px-5 py-6 bg-card border border-border/60 transition-colors duration-200 hover:border-primary/40">
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
        <div>
          <div className="text-sm font-semibold line-clamp-1">{a.title}</div>
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.message}</div>
        </div>
      </Link>
    );
  }

  return (
    <div className="glass-card p-4 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" />
          <h3 className="font-bold">Annonces</h3>
        </div>
        <Link to="/dashboard/announcements" className="text-xs text-primary hover:underline">Voir plus</Link>
      </div>
      <div className="space-y-2">
        {items.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-3 rounded-lg bg-primary/5 border border-primary/20"
          >
            <div className="font-semibold text-sm">{a.title}</div>
            <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
            <div className="text-[10px] text-muted-foreground mt-1">
              {new Date(a.created_at).toLocaleDateString('fr-FR')}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
