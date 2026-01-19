import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminNotificationsAPI } from '@/api/support';

type AdminNotification = {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | string;
  title: string;
  message: string;
  read: boolean;
  createdAtIso?: string;
  data?: any;
};

const NotificationsPage = () => {
  const { toast } = useToast();
  const [notifications, setNotificationsState] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const resp = await adminNotificationsAPI.list({ limit: 100, unreadOnly: false });
      if (!resp?.success) throw new Error(resp?.message || 'Failed to load notifications');
      setUnreadCount(Number(resp?.data?.unreadCount ?? 0) || 0);
      setNotificationsState(Array.isArray(resp?.data?.notifications) ? resp.data.notifications : []);
    } catch (e: any) {
      toast({ title: 'Error', description: String(e?.message || 'Failed to load notifications'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    try {
      const resp = await adminNotificationsAPI.markRead(id);
      if (!resp?.success) throw new Error(resp?.message || 'Failed to mark read');
      setNotificationsState((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e: any) {
      toast({ title: 'Error', description: String(e?.message || 'Failed to mark read'), variant: 'destructive' });
    }
  };

  const markAllRead = async () => {
    try {
      const resp = await adminNotificationsAPI.markAllRead();
      if (!resp?.success) throw new Error(resp?.message || 'Failed to mark all read');
      setNotificationsState((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast({ title: 'Done', description: 'All notifications marked as read.' });
    } catch (e: any) {
      toast({ title: 'Error', description: String(e?.message || 'Failed to mark all read'), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Real-time notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
          <Button onClick={markAllRead} disabled={loading || unreadCount === 0}>Mark all read</Button>
        </div>
      </div>
      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card key={notification.id} className="glass">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${notification.type === 'warning' ? 'bg-warning/10' : notification.type === 'error' ? 'bg-destructive/10' : notification.type === 'success' ? 'bg-success/10' : 'bg-info/10'}`}>
                  <Bell className={`h-5 w-5 ${notification.type === 'warning' ? 'text-warning' : notification.type === 'error' ? 'text-destructive' : notification.type === 'success' ? 'text-success' : 'text-info'}`} />
                </div>
                <div>
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  {notification.createdAtIso && (
                    <p className="text-xs text-muted-foreground mt-1">{new Date(notification.createdAtIso).toLocaleString()}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={notification.read ? 'inactive' : 'active'} />
                {!notification.read && (
                  <Button size="sm" variant="outline" onClick={() => markRead(notification.id)}>
                    Mark read
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && notifications.length === 0 && (
          <Card className="glass">
            <CardContent className="p-6 text-muted-foreground">No notifications</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
