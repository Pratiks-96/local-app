import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';

const CATEGORIES = [
  'GENERAL', 'BUY_SELL', 'LOST_FOUND', 'EVENTS', 'ALERTS', 'JOBS', 'RECOMMENDATIONS',
];

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreatePostModal({ open, onClose, onCreated }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await api.post('/posts', { title: title || undefined, content, category });
      toast({ title: 'Post created!', variant: 'success' });
      setContent('');
      setTitle('');
      onCreated();
      onClose();
    } catch {
      toast({ title: 'Failed to create post', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="card w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create Post</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
          />
          <textarea
            placeholder="What's happening in your neighborhood?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input min-h-[120px] resize-none"
            required
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
