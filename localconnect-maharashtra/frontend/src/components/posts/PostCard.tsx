import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Bookmark, Share2, MapPin, Pin } from 'lucide-react';
import { cn, CATEGORY_LABELS, formatLocationPath } from '@/lib/utils';

export interface Post {
  id: string;
  title?: string;
  content: string;
  category: string;
  isPinned?: boolean;
  createdAt: string;
  mediaUrls?: string[];
  tags?: string[];
  author: { id: string; firstName: string; lastName: string; avatarUrl?: string };
  location?: { name: string; parent?: { name: string; parent?: { name: string } } };
  _count?: { likes: number; comments: number };
  liked?: boolean;
  bookmarked?: boolean;
}

interface PostCardProps {
  post: Post;
  onLike?: (id: string) => void;
  onBookmark?: (id: string) => void;
}

export function PostCard({ post, onLike, onBookmark }: PostCardProps) {
  return (
    <article className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 font-semibold">
            {post.author.firstName[0]}{post.author.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-sm">
              {post.author.firstName} {post.author.lastName}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {formatLocationPath(post.location)}
              <span>·</span>
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {post.isPinned && <Pin className="h-4 w-4 text-brand-600" />}
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
            {CATEGORY_LABELS[post.category] || post.category}
          </span>
        </div>
      </div>

      <Link to={`/posts/${post.id}`} className="block space-y-2">
        {post.title && <h3 className="font-semibold">{post.title}</h3>}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <img src={post.mediaUrls[0]} alt="" className="rounded-lg w-full max-h-80 object-cover" />
        )}
      </Link>

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs text-brand-600">#{tag}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-2 border-t border-[hsl(var(--border))]">
        <button
          onClick={() => onLike?.(post.id)}
          className={cn('flex items-center gap-1 text-sm', post.liked && 'text-red-500')}
        >
          <Heart className={cn('h-4 w-4', post.liked && 'fill-current')} />
          {post._count?.likes || 0}
        </button>
        <Link to={`/posts/${post.id}`} className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
          <MessageCircle className="h-4 w-4" />
          {post._count?.comments || 0}
        </Link>
        <button
          onClick={() => onBookmark?.(post.id)}
          className={cn('flex items-center gap-1 text-sm ml-auto', post.bookmarked && 'text-brand-600')}
        >
          <Bookmark className={cn('h-4 w-4', post.bookmarked && 'fill-current')} />
        </button>
        <button className="text-[hsl(var(--muted-foreground))]">
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
