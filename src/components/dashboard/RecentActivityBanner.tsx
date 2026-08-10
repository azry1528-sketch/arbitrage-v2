import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diffMs / 3_600_000);
  if (h < 1) return `il y a ${Math.max(1, Math.floor(diffMs / 60_000))} min`;
  if (h < 24) return `il y a ${h} heure${h > 1 ? 's' : ''}`;
  const d = Math.floor(h / 24);
  return `il y a ${d} jour${d > 1 ? 's' : ''}`;
}

// Ligne d'activité récente — reprend la notification contextuelle affichée
// sous la carte solde sur Binance ("Dépôt en SOL terminé, il y a 17h"),
// alimentée par la dernière notification réelle de l'utilisateur.
export function RecentActivityBanner() {
  const { profile } = useAuth();
  const [item, setItem] = useState<{ title: string; created_at: string } | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from('notifications' as any)
      .select('title, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => setItem((data as any)?.[0] || null));
  }, [profile?.id]);

  if (!item) return null;

  return (
    <Link to="/dashboard/portfolio" className="flex items-center gap-2 px-1 py-1 text-sm hover:text-primary transition-colors duration-200 group">
      <Bell className="w-4 h-4 text-primary shrink-0" />
      <span className="text-foreground">{item.title}</span>
      <span className="text-muted-foreground text-xs">{timeAgo(item.created_at)}</span>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto group-hover:translate-x-0.5 transition-transform duration-200" />
    </Link>
  );
}
