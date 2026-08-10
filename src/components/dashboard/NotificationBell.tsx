import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Notif {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type: string;
}

export function NotificationBell() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  const fetch = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('notifications' as any)
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setItems((data as any) || []);
  };

  useEffect(() => {
    fetch();
    if (!profile?.id) return;
    const channel = supabase
      .channel('notif-' + profile.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  const unread = items.filter(n => !n.is_read).length;
  const visible = tab === 'unread' ? items.filter(n => !n.is_read) : items;

  const markAllRead = async () => {
    if (!profile?.id) return;
    await supabase.from('notifications' as any).update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false);
    fetch();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="font-semibold">Notifications</div>
          {unread > 0 && <button onClick={markAllRead} className="text-xs text-primary hover:underline">Tout marquer lu</button>}
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'unread')}>
          <TabsList className="w-full rounded-none bg-transparent border-b border-border p-0 h-auto">
            <TabsTrigger value="all" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary py-2">
              Toutes
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary py-2">
              Non lues {unread > 0 && `(${unread})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="max-h-96 overflow-y-auto">
          {visible.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Aucune notification</div>
          ) : visible.map(n => (
            <div key={n.id} className={`p-3 border-b border-border/50 ${!n.is_read ? 'bg-primary/5' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-sm">{n.title}</div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
              <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
