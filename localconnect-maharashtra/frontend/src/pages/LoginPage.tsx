import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/components/ui/Toaster';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast({ title: 'Welcome back!', variant: 'success' });
      navigate('/feed');
    } catch {
      toast({ title: 'Invalid credentials', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 to-teal-50 dark:from-brand-950 dark:to-[hsl(var(--background))]">
      <div className="card w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="text-2xl font-bold text-brand-700">🏘️ LocalConnect</Link>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Sign in to your neighborhood</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input mt-1" required />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input mt-1" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-brand-600 font-medium">Register</Link>
        </p>
        <p className="text-xs text-center text-[hsl(var(--muted-foreground))]">
          Demo: rajesh@example.com / Password123!
        </p>
      </div>
    </div>
  );
}
