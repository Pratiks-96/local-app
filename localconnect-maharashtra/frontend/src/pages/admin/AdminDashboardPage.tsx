import { useQuery } from '@tanstack/react-query';
import { Users, FileText, Flag, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data: res } = await api.get('/admin/dashboard');
      return res;
    },
  });

  const stats = [
    { label: 'Users', value: data?.stats?.users, icon: Users, color: 'text-blue-600' },
    { label: 'Posts', value: data?.stats?.posts, icon: FileText, color: 'text-green-600' },
    { label: 'Pending Reports', value: data?.stats?.pendingReports, icon: Flag, color: 'text-red-600' },
    { label: 'Marketplace Items', value: data?.stats?.marketplaceItems, icon: ShoppingBag, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {isLoading ? (
        <div className="grid md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="card h-24 animate-pulse" />)}</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-6">
              <Icon className={`h-8 w-8 ${color} mb-2`} />
              <p className="text-3xl font-bold">{value ?? 0}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4">
        <Link to="/admin/users" className="btn-primary">Manage Users</Link>
        <Link to="/admin/reports" className="btn-secondary">View Reports</Link>
      </div>

      {data?.recentUsers && (
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Recent Users</h2>
          <div className="space-y-2">
            {data.recentUsers.map((u: { id: string; firstName: string; lastName: string; email: string }) => (
              <div key={u.id} className="flex justify-between text-sm border-b pb-2">
                <span>{u.firstName} {u.lastName}</span>
                <span className="text-[hsl(var(--muted-foreground))]">{u.email}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
