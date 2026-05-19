import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { CATEGORY_LABELS } from '@/lib/utils';
import { toast } from '@/components/ui/Toaster';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data } = await api.get(`/posts/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/posts/${id}/comments`, { content }),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      toast({ title: 'Comment added', variant: 'success' });
    },
  });

  if (isLoading) return <div className="card p-8 animate-pulse h-64" />;
  if (!post) return <p>Post not found</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <article className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center font-semibold text-brand-700">
            {post.author.firstName[0]}{post.author.lastName[0]}
          </div>
          <div>
            <p className="font-medium">{post.author.firstName} {post.author.lastName}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {CATEGORY_LABELS[post.category]} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        {post.title && <h1 className="text-xl font-bold">{post.title}</h1>}
        <p className="whitespace-pre-wrap">{post.content}</p>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{post._count?.likes || 0} likes</p>
      </article>

      <section className="card p-6 space-y-4">
        <h2 className="font-semibold">Comments ({post.comments?.length || 0})</h2>
        {user && (
          <form onSubmit={(e) => { e.preventDefault(); commentMutation.mutate(comment); }} className="flex gap-2">
            <input value={comment} onChange={(e) => setComment(e.target.value)} className="input flex-1" placeholder="Write a comment..." required />
            <button type="submit" className="btn-primary">Reply</button>
          </form>
        )}
        <div className="space-y-4">
          {post.comments?.map((c: { id: string; content: string; author: { firstName: string; lastName: string }; createdAt: string }) => (
            <div key={c.id} className="border-l-2 border-brand-200 pl-4">
              <p className="text-sm font-medium">{c.author.firstName} {c.author.lastName}</p>
              <p className="text-sm">{c.content}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
