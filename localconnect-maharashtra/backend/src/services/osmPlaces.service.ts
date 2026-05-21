/**
 * Free geocoding & places via OpenStreetMap (Photon + Nominatim + Overpass).
 * No API key required. Respect OSM usage policy (max ~1 req/s to Nominatim).
 */

const USER_AGENT = 'LocalConnectMaharashtra/1.0 (contact: admin@localconnect.in)';
const PHOTON = 'https://photon.komoot.io/api';
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const OVERPASS = 'https://overpass-api.de/api/interpreter';

/** Maharashtra bounding box for search bias */
const MH_VIEWBOX = '72.5,15.5,80.5,22.5';

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
}

export interface NearbyPlace {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  types: string[];
  vicinity?: string;
}

let lastNominatimAt = 0;

async function nominatimFetch(path: string): Promise<Response> {
  const now = Date.now();
  const wait = 1100 - (now - lastNominatimAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastNominatimAt = Date.now();

  return fetch(`${NOMINATIM}${path}`, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });
}

export function isPlacesConfigured(): boolean {
  return true;
}

export async function autocomplete(
  input: string,
  lat?: number,
  lng?: number,
): Promise<PlaceSuggestion[]> {
  if (input.trim().length < 2) return [];

  const params = new URLSearchParams({
    q: `${input.trim()}, Maharashtra, India`,
    limit: '10',
    lang: 'en',
    bbox: MH_VIEWBOX,
  });

  if (lat != null && lng != null) {
    params.set('lat', String(lat));
    params.set('lon', String(lng));
  }

  try {
    const res = await fetch(`${PHOTON}/?${params}`, {
      headers: { Accept: 'application/json' },
    });
    const data = (await res.json()) as {
      features?: Array<{
        geometry: { coordinates: [number, number] };
        properties: {
          osm_id?: number;
          osm_type?: string;
          name?: string;
          city?: string;
          state?: string;
          country?: string;
          street?: string;
          district?: string;
        };
      }>;
    };

    return (data.features || []).map((f) => {
      const [lngVal, latVal] = f.geometry.coordinates;
      const p = f.properties;
      const mainText = p.name || input;
      const parts = [p.street, p.district, p.city, p.state].filter(Boolean);
      const secondaryText = parts.join(', ');
      const description = [mainText, secondaryText].filter(Boolean).join(', ');
      const placeId =
        p.osm_id && p.osm_type
          ? `osm:${p.osm_type}:${p.osm_id}`
          : `${latVal},${lngVal}`;

      return {
        placeId,
        description,
        mainText,
        secondaryText,
      };
    });
  } catch (err) {
    console.warn('Photon autocomplete error:', err);
    return [];
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const coordMatch = placeId.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    const rev = await reverseGeocode(lat, lng);
    return {
      placeId,
      name: rev?.name || 'Selected location',
      formattedAddress: rev?.display_name || `${lat}, ${lng}`,
      lat,
      lng,
    };
  }

  const osmMatch = placeId.match(/^osm:(\w+):(\d+)$/);
  if (osmMatch) {
    const [, osmType, osmId] = osmMatch;
    const prefix = osmType === 'relation' ? 'R' : osmType === 'way' ? 'W' : 'N';
    try {
      const res = await nominatimFetch(
        `/lookup?osm_ids=${prefix}${osmId}&format=json&addressdetails=1`,
      );
      const data = (await res.json()) as Array<{
        place_id: number;
        lat: string;
        lon: string;
        display_name: string;
        name?: string;
      }>;
      const item = data[0];
      if (!item) return null;
      return {
        placeId,
        name: item.name || item.display_name.split(',')[0],
        formattedAddress: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      };
    } catch (err) {
      console.warn('Nominatim lookup error:', err);
      return null;
    }
  }

  return null;
}

async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await nominatimFetch(
      `/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
    );
    const data = (await res.json()) as {
      display_name?: string;
      name?: string;
      address?: { suburb?: string; city?: string; state?: string };
    };
    const name =
      data.name ||
      data.address?.suburb ||
      data.address?.city ||
      data.display_name?.split(',')[0];
    return { display_name: data.display_name || '', name };
  } catch {
    return null;
  }
}

export async function nearbyPlaces(
  lat: number,
  lng: number,
  radiusM = 2000,
): Promise<NearbyPlace[]> {
  const radius = Math.min(radiusM, 5000);
  const query = `
[out:json][timeout:25];
(
  node["amenity"~"restaurant|cafe|school|hospital|pharmacy|bank|marketplace|place_of_worship"](around:${radius},${lat},${lng});
  node["shop"](around:${radius},${lat},${lng});
);
out body 20;
`;

  try {
    const res = await fetch(OVERPASS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    const data = (await res.json()) as {
      elements?: Array<{
        id: number;
        lat?: number;
        lon?: number;
        tags?: { name?: string; amenity?: string; shop?: string };
      }>;
    };

    return (data.elements || [])
      .filter((el) => el.lat != null && el.lon != null && el.tags?.name)
      .slice(0, 25)
      .map((el) => ({
        placeId: `osm:node:${el.id}`,
        name: el.tags!.name!,
        lat: el.lat!,
        lng: el.lon!,
        types: [el.tags?.amenity || el.tags?.shop || 'place'].filter(Boolean) as string[],
        vicinity: el.tags?.amenity || el.tags?.shop,
      }));
  } catch (err) {
    console.warn('Overpass nearby error:', err);
    return [];
  }
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({
      q: `${address}, Maharashtra, India`,
      format: 'json',
      limit: '1',
      countrycodes: 'in',
    });
    const res = await nominatimFetch(`/search?${params}`);
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
