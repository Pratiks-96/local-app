import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, IndianRupee } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  photos: string[];
  isSold: boolean;
  author: { firstName: string; lastName: string };
}

export default function MarketplacePage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '', condition: 'GOOD' });
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['marketplace'],
    queryFn: async () => {
      const { data } = await api.get('/marketplace');
      return data as MarketplaceItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: object) => api.post('/marketplace', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      setShowForm(false);
      setForm({ title: '', description: '', price: '', condition: 'GOOD' });
      toast({ title: 'Item listed!', variant: 'success' });
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary gap-1">
          <Plus className="h-4 w-4" /> Sell Item
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ ...form, price: parseFloat(form.price) });
          }}
          className="card p-6 space-y-4"
        >
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" required />
          <input type="number" placeholder="Price (₹)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" required />
          <button type="submit" className="btn-primary">List Item</button>
        </form>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="card h-48 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="card overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-[hsl(var(--muted))] flex items-center justify-center text-4xl">📦</div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">{item.description}</p>
                <p className="flex items-center gap-1 font-bold text-brand-600">
                  <IndianRupee className="h-4 w-4" />{item.price.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  by {item.author.firstName} {item.author.lastName} · {item.condition}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
