import { useState, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { PostCard, Post } from '@/components/posts/PostCard';
import { CreatePostModal } from '@/components/posts/CreatePostModal';
import { FeedSkeleton } from '@/components/ui/FeedSkeleton';
import { CATEGORY_LABELS } from '@/lib/utils';

export default function FeedPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [category, setCategory] = useState<string>('');
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useInfiniteQuery({
      queryKey: ['feed', category],
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams({ limit: '20' });
        if (pageParam) params.set('cursor', pageParam);
        if (category) params.set('category', category);
        const { data: res } = await api.get(`/posts/feed?${params}`);
        return res as { posts: Post[]; nextCursor: string | null };
      },
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      initialPageParam: undefined as string | undefined,
    });

  const likeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/posts/${id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const bookmarkMutation = useMutation({
    mutationFn: (id: string) => api.post(`/posts/${id}/bookmark`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Neighborhood Feed</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary gap-1">
          <Plus className="h-4 w-4" /> Post
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setCategory('')}
          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${!category ? 'bg-brand-600 text-white' : 'bg-[hsl(var(--muted))]'}`}
        >
          All
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${category === key ? 'bg-brand-600 text-white' : 'bg-[hsl(var(--muted))]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <FeedSkeleton count={3} />
      ) : posts.length === 0 ? (
        <div className="card p-8 text-center text-[hsl(var(--muted-foreground))]">
          No posts yet. Be the first to share with your neighbors!
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={(id) => likeMutation.mutate(id)}
              onBookmark={(id) => bookmarkMutation.mutate(id)}
            />
          ))}
          <div ref={ref} className="h-4" />
          {isFetchingNextPage && <FeedSkeleton count={1} />}
        </div>
      )}

      <CreatePostModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => refetch()} />
    </div>
  );
}
