import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data as Notification[];
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" /> Notifications
        </h1>
        <button onClick={() => markAllRead.mutate()} className="btn-secondary text-sm">Mark all read</button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="card p-8 text-center text-[hsl(var(--muted-foreground))]">No notifications yet</div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={`card p-4 ${!n.isRead ? 'border-brand-300 bg-brand-50/50 dark:bg-brand-900/10' : ''}`}>
              <p className="font-medium text-sm">{n.title}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{n.body}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
