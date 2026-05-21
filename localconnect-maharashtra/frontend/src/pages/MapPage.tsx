import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Map as MapIcon, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { NeighborhoodMap, MapLegend } from '@/components/maps/NeighborhoodMap';
import { api } from '@/lib/api';
import type { MapContentResponse, MapMarkerType } from '@/types/map';
import { cn } from '@/lib/utils';

const FILTERS: { type: MapMarkerType | 'all'; label: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'post', label: 'Posts' },
  { type: 'marketplace', label: 'Marketplace' },
  { type: 'society', label: 'Societies' },
  { type: 'place', label: 'Nearby places' },
];

export default function MapPage() {
  const [filter, setFilter] = useState<MapMarkerType | 'all'>('all');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['map-content'],
    queryFn: async () => {
      const { data: res } = await api.get<MapContentResponse>('/map/content');
      return res;
    },
  });

  const filterTypes = useMemo(
    () => (filter === 'all' ? undefined : [filter]),
    [filter],
  );

  const visibleMarkers = useMemo(() => {
    if (!data) return [];
    if (filter === 'all') return data.markers;
    return data.markers.filter((m) => m.type === filter);
  }, [data, filter]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapIcon className="h-7 w-7 text-brand-600" />
              Neighborhood Map
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              Posts, listings, societies & nearby places — free OpenStreetMap, no API key
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-secondary flex items-center gap-2 self-start"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {data?.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Posts', count: data.stats.posts },
              { label: 'Listings', count: data.stats.marketplace },
              { label: 'Societies', count: data.stats.societies },
              { label: 'Places', count: data.stats.places },
            ].map((s) => (
              <div key={s.label} className="card p-3 text-center">
                <p className="text-2xl font-bold text-brand-600">{s.count}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.type}
              type="button"
              onClick={() => setFilter(f.type)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                filter === f.type
                  ? 'bg-brand-600 text-white'
                  : 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))]',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <MapLegend />

        {isLoading ? (
          <div className="card p-12 text-center text-[hsl(var(--muted-foreground))]">Loading map...</div>
        ) : data ? (
          <>
            <NeighborhoodMap
              center={data.center}
              markers={data.markers}
              height="480px"
              filterTypes={filterTypes}
            />

            <div className="card p-4">
              <h2 className="font-semibold mb-3">
                In your area ({visibleMarkers.length})
              </h2>
              <ul className="divide-y divide-[hsl(var(--border))] max-h-80 overflow-auto">
                {visibleMarkers.length === 0 ? (
                  <li className="py-4 text-sm text-[hsl(var(--muted-foreground))]">
                    No items for this filter. Try another category or widen your search.
                  </li>
                ) : (
                  visibleMarkers.map((m) => (
                    <li key={`${m.type}-${m.id}`} className="py-3 flex justify-between gap-3">
                      <div>
                        <span className="text-xs uppercase font-medium text-[hsl(var(--muted-foreground))]">
                          {m.type}
                        </span>
                        <p className="font-medium">{m.title}</p>
                        {m.subtitle && (
                          <p className="text-sm text-[hsl(var(--muted-foreground))]">{m.subtitle}</p>
                        )}
                      </div>
                      {m.link && (
                        <Link to={m.link} className="text-sm text-brand-600 shrink-0 self-center">
                          Open
                        </Link>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>

            {data.osmPlacesEnabled && data.stats.places === 0 && (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Nearby shops and amenities load from OpenStreetMap — zoom or refresh if none appear yet.
              </p>
            )}
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
