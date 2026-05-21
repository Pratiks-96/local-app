export type MapMarkerType = 'post' | 'marketplace' | 'society' | 'place';

export interface MapMarker {
  id: string;
  type: MapMarkerType;
  title: string;
  subtitle?: string;
  lat: number;
  lng: number;
  category?: string;
  link?: string;
  meta?: Record<string, unknown>;
}

export interface MapContentResponse {
  center: { lat: number; lng: number };
  radiusKm: number;
  markers: MapMarker[];
  osmPlacesEnabled: boolean;
  mapProvider?: 'openstreetmap';
  stats: {
    posts: number;
    marketplace: number;
    societies: number;
    places: number;
  };
}

export interface LocationMatch {
  locationId: string;
  distanceKm: number;
  society: string;
  area?: string;
  city?: string;
  state?: string;
  path: string;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}
