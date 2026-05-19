import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/components/ui/Toaster';

interface LocationNode {
  id: string;
  name: string;
  type: string;
  children?: LocationNode[];
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [tree, setTree] = useState<LocationNode | null>(null);
  const [cityId, setCityId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [societyId, setSocietyId] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/locations').then(({ data }) => setTree(data)).catch(() => {});
  }, []);

  const cities = tree?.children || [];
  const selectedCity = cities.find((c) => c.id === cityId);
  const areas = selectedCity?.children || [];
  const selectedArea = areas.find((a) => a.id === areaId);
  const societies = selectedArea?.children || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!societyId) {
      toast({ title: 'Please select your society', variant: 'error' });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        ...form,
        locationId: societyId,
      });
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast({ title: 'Welcome to LocalConnect!', variant: 'success' });
      navigate('/feed');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ title: msg || 'Registration failed', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <div className="card w-full max-w-lg p-8 space-y-6">
        <div className="text-center">
          <Link to="/" className="text-2xl font-bold text-brand-700">🏘️ LocalConnect</Link>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">Join your Maharashtra community</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input" required />
            <input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input" required />
          </div>
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" required />
          <input type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" required minLength={8} />

          <p className="text-sm font-medium">Your Location (Maharashtra)</p>
          <select value={cityId} onChange={(e) => { setCityId(e.target.value); setAreaId(''); setSocietyId(''); }} className="input" required>
            <option value="">Select City</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={areaId} onChange={(e) => { setAreaId(e.target.value); setSocietyId(''); }} className="input" required disabled={!cityId}>
            <option value="">Select Area</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={societyId} onChange={(e) => setSocietyId(e.target.value)} className="input" required disabled={!areaId}>
            <option value="">Select Society / Locality</option>
            {societies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm">
          Already have an account? <Link to="/login" className="text-brand-600 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
