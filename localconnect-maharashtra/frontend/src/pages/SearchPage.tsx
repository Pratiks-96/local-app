import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, FileText, Users, MapPin, ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatLocationPath } from '@/lib/utils';

type SearchType = 'all' | 'posts' | 'users' | 'locations' | 'marketplace';

interface SearchResults {
  posts?: Array<{
    id: string;
    title?: string;
    content: string;
    author: { firstName: string; lastName: string };
  }>;
  users?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }>;
  locations?: Array<{
    id: string;
    name: string;
    type: string;
    parent?: { name: string; parent?: { name: string } };
  }>;
  marketplace?: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
  }>;
}

const TABS: { id: SearchType; label: string; icon: typeof SearchIcon }[] = [
  { id: 'all', label: 'All', icon: SearchIcon },
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'users', label: 'People', icon: Users },
  { id: 'locations', label: 'Places', icon: MapPin },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [submitted, setSubmitted] = useState(initialQ.length >= 2 ? initialQ : '');
  const [type, setType] = useState<SearchType>('all');

  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q.length >= 2) {
      setQuery(q);
      setSubmitted(q);
    }
  }, [searchParams]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', submitted, type],
    queryFn: async () => {
      const { data: res } = await api.get<SearchResults>('/search', {
        params: { q: submitted, type },
      });
      return res;
    },
    enabled: submitted.length >= 2,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      setSubmitted(query.trim());
    }
  };

  const hasResults =
    data &&
    ((data.posts?.length ?? 0) +
      (data.users?.length ?? 0) +
      (data.locations?.length ?? 0) +
      (data.marketplace?.length ?? 0) >
      0);

  const showSection = (section: SearchType) => type === 'all' || type === section;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>

      <form onSubmit={handleSearch} className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts, people, places, marketplace..."
          className="input pl-10 py-2.5"
          autoFocus
        />
        <button type="submit" className="btn-primary absolute right-1 top-1/2 -translate-y-1/2 text-sm py-1.5">
          Search
        </button>
      </form>

      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Enter at least 2 characters. Results are scoped to your neighborhood where applicable.
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setType(id)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap',
              type === id ? 'bg-brand-600 text-white' : 'bg-[hsl(var(--muted))]',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {submitted.length < 2 && (
        <div className="card p-8 text-center text-[hsl(var(--muted-foreground))]">
          Type a keyword and press Search
        </div>
      )}

      {submitted.length >= 2 && (isLoading || isFetching) && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-16 animate-pulse" />
          ))}
        </div>
      )}

      {submitted.length >= 2 && !isLoading && !hasResults && (
        <div className="card p-8 text-center text-[hsl(var(--muted-foreground))]">
          No results for &quot;{submitted}&quot;
        </div>
      )}

      {data && showSection('posts') && (data.posts?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" /> Posts
          </h2>
          {data.posts!.map((post) => (
            <Link key={post.id} to={`/posts/${post.id}`} className="card p-4 block hover:shadow-md transition-shadow">
              {post.title && <p className="font-medium">{post.title}</p>}
              <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">{post.content}</p>
              <p className="text-xs mt-2 text-brand-600">
                {post.author.firstName} {post.author.lastName}
              </p>
            </Link>
          ))}
        </section>
      )}

      {data && showSection('users') && (data.users?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" /> People
          </h2>
          {data.users!.map((u) => (
            <Link key={u.id} to={`/profile/${u.id}`} className="card p-4 flex items-center gap-3 hover:shadow-md">
              <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center font-semibold text-brand-700">
                {u.firstName[0]}{u.lastName[0]}
              </div>
              <span className="font-medium">{u.firstName} {u.lastName}</span>
            </Link>
          ))}
        </section>
      )}

      {data && showSection('locations') && (data.locations?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Places
          </h2>
          {data.locations!.map((loc) => (
            <div key={loc.id} className="card p-4">
              <p className="font-medium">{loc.name}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] capitalize">{loc.type}</p>
              {loc.parent && (
                <p className="text-xs text-brand-600 mt-1">{formatLocationPath(loc)}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {data && showSection('marketplace') && (data.marketplace?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" /> Marketplace
          </h2>
          {data.marketplace!.map((item) => (
            <div key={item.id} className="card p-4">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-1">{item.description}</p>
              <p className="text-brand-600 font-bold mt-1">₹{item.price.toLocaleString('en-IN')}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
