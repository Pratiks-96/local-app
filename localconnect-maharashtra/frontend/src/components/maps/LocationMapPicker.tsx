import { useCallback, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { api } from '@/lib/api';
import type { LocationMatch, PlaceSuggestion } from '@/types/map';
import { NeighborhoodMap } from './NeighborhoodMap';

interface LocationMapPickerProps {
  onLocationSelect: (locationId: string, match: LocationMatch) => void;
  selectedLocationId?: string;
}

export function LocationMapPicker({ onLocationSelect, selectedLocationId }: LocationMapPickerProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [match, setMatch] = useState<LocationMatch | null>(null);
  const [center, setCenter] = useState({ lat: 18.5998, lng: 73.762 });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const searchPlaces = useCallback(
    (text: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (text.length < 2) {
        setSuggestions([]);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        try {
          const { data } = await api.get<PlaceSuggestion[]>('/places/autocomplete', {
            params: { input: text, lat: center.lat, lng: center.lng },
          });
          setSuggestions(data);
        } catch {
          setSuggestions([]);
        }
      }, 400);
    },
    [center.lat, center.lng],
  );

  const selectPlace = async (placeId: string, description: string) => {
    setLoading(true);
    setSuggestions([]);
    setQuery(description);
    try {
      const { data: details } = await api.get<{ lat: number; lng: number; name: string }>(
        '/places/details',
        { params: { placeId } },
      );
      setCenter({ lat: details.lat, lng: details.lng });

      const { data: locationMatch } = await api.post<LocationMatch>('/map/match-location', {
        lat: details.lat,
        lng: details.lng,
      });
      setMatch(locationMatch);
      onLocationSelect(locationMatch.locationId, locationMatch);
    } catch {
      setMatch(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Search powered by free OpenStreetMap — no Google account or API key needed.
      </p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            searchPlaces(e.target.value);
          }}
          placeholder="Search area in Maharashtra (e.g. Wakad, Powai, Hiranandani)"
          className="input pl-10"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-[1000] left-0 right-0 mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg max-h-48 overflow-auto">
            {suggestions.map((s) => (
              <li key={s.placeId}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-[hsl(var(--muted))] text-sm"
                  onClick={() => selectPlace(s.placeId, s.description)}
                >
                  <span className="font-medium">{s.mainText}</span>
                  {s.secondaryText && (
                    <span className="block text-xs text-[hsl(var(--muted-foreground))]">
                      {s.secondaryText}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {loading && (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Finding your neighborhood...</p>
      )}

      {match && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800">
          <MapPin className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-brand-800 dark:text-brand-200">Matched location</p>
            <p className="text-sm">{match.path}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              ~{match.distanceKm} km from map pin
            </p>
          </div>
        </div>
      )}

      <NeighborhoodMap center={center} markers={[]} height="280px" zoom={13} />

      {selectedLocationId && match?.locationId === selectedLocationId && (
        <p className="text-xs text-green-600 dark:text-green-400">✓ Society selected for registration</p>
      )}
    </div>
  );
}
