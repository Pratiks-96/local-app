import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: res } = await api.get('/admin/users');
      return res;
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, ...body }: { id: string; role?: string; isActive?: boolean }) =>
      api.patch(`/admin/users/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'User updated', variant: 'success' });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>
      {isLoading ? (
        <div className="card h-64 animate-pulse" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.users?.map((u: { id: string; firstName: string; lastName: string; email: string; role: string; isActive: boolean }) => (
                <tr key={u.id} className="border-b">
                  <td className="p-3">{u.firstName} {u.lastName}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      onChange={(e) => updateUser.mutate({ id: u.id, role: e.target.value })}
                      className="input py-1 text-xs"
                    >
                      <option value="USER">User</option>
                      <option value="MODERATOR">Moderator</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="p-3">{u.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="p-3">
                    <button
                      onClick={() => updateUser.mutate({ id: u.id, isActive: !u.isActive })}
                      className="btn-secondary text-xs py-1"
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
