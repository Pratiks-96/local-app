import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { toast } from '@/components/ui/Toaster';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: '',
  });

  const updateMutation = useMutation({
    mutationFn: (data: object) => api.patch('/users/profile', data),
    onSuccess: ({ data }) => {
      setUser(data);
      toast({ title: 'Profile updated', variant: 'success' });
    },
  });

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }} className="space-y-3">
          <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input" placeholder="First name" />
          <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input" placeholder="Last name" />
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input" placeholder="Bio" rows={3} />
          <button type="submit" className="btn-primary">Save Changes</button>
        </form>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold">Appearance</h2>
        <div className="flex gap-2">
          <button onClick={() => setTheme('light')} className={`btn-secondary flex-1 ${theme === 'light' ? 'ring-2 ring-brand-500' : ''}`}>Light</button>
          <button onClick={() => setTheme('dark')} className={`btn-secondary flex-1 ${theme === 'dark' ? 'ring-2 ring-brand-500' : ''}`}>Dark</button>
        </div>
      </div>

      <div className="card p-6">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Email: {user?.email}</p>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Role: {user?.role}</p>
      </div>
    </div>
  );
}
