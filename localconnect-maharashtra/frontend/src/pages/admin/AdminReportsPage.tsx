import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data } = await api.get('/admin/reports');
      return data;
    },
  });

  const resolveReport = useMutation({
    mutationFn: ({ id, status, removePost }: { id: string; status: string; removePost?: boolean }) =>
      api.patch(`/admin/reports/${id}`, { status, removePost }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast({ title: 'Report updated', variant: 'success' });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      {isLoading ? (
        <div className="card h-48 animate-pulse" />
      ) : reports.length === 0 ? (
        <div className="card p-8 text-center text-[hsl(var(--muted-foreground))]">No pending reports</div>
      ) : (
        <div className="space-y-4">
          {reports.map((r: { id: string; reason: string; status: string; post?: { content: string; author: { firstName: string } } }) => (
            <div key={r.id} className="card p-4 space-y-3">
              <p className="font-medium">Reason: {r.reason}</p>
              {r.post && (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Post by {r.post.author.firstName}: {r.post.content.slice(0, 150)}...
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={() => resolveReport.mutate({ id: r.id, status: 'RESOLVED' })} className="btn-primary text-sm">Resolve</button>
                <button onClick={() => resolveReport.mutate({ id: r.id, status: 'RESOLVED', removePost: true })} className="btn-secondary text-sm text-red-600">Remove Post</button>
                <button onClick={() => resolveReport.mutate({ id: r.id, status: 'DISMISSED' })} className="btn-secondary text-sm">Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
