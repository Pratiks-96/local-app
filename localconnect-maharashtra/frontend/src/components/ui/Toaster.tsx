import { create } from 'zustand';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error';
}

interface ToastStore {
  toasts: Toast[];
  add: (toast: Omit<Toast, 'id'>) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: Math.random().toString(36).slice(2) }],
    })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(opts: Omit<Toast, 'id'>) {
  useToastStore.getState().add(opts);
}

export function Toaster() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast: t, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        'card p-4 flex items-start gap-3 shadow-lg animate-in slide-in-from-right',
        t.variant === 'error' && 'border-red-300',
        t.variant === 'success' && 'border-green-300',
      )}
    >
      <div className="flex-1">
        <p className="font-medium text-sm">{t.title}</p>
        {t.description && <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{t.description}</p>}
      </div>
      <button onClick={onClose} className="text-[hsl(var(--muted-foreground))] hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
