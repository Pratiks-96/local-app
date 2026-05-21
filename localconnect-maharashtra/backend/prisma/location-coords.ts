/** Approximate WGS84 coordinates for Maharashtra seed locations */
export const LOCATION_COORDS: Record<string, { lat: number; lng: number }> = {
  Maharashtra: { lat: 19.7515, lng: 75.7139 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Nagpur: { lat: 21.1458, lng: 79.0882 },
  Nashik: { lat: 19.9975, lng: 73.7898 },
  Aurangabad: { lat: 19.8762, lng: 75.3433 },
  Kolhapur: { lat: 16.705, lng: 74.2433 },
  Thane: { lat: 19.2183, lng: 72.9781 },
  Solapur: { lat: 17.6599, lng: 75.9064 },
  Wakad: { lat: 18.5998, lng: 73.762 },
  Hinjewadi: { lat: 18.5912, lng: 73.7389 },
  Baner: { lat: 18.559, lng: 73.7868 },
  Kharadi: { lat: 18.5507, lng: 73.947 },
  Andheri: { lat: 19.1197, lng: 72.8468 },
  Powai: { lat: 19.1176, lng: 72.906 },
  Bandra: { lat: 19.0544, lng: 72.8406 },
  Dharampeth: { lat: 21.1384, lng: 79.0583 },
  Sitabuldi: { lat: 21.152, lng: 79.086 },
  'Gangapur Road': { lat: 20.011, lng: 73.76 },
  CIDCO: { lat: 19.8762, lng: 75.3433 },
  Rajarampuri: { lat: 16.704, lng: 74.243 },
  'Ghodbunder Road': { lat: 19.262, lng: 72.967 },
  'Siddheshwar Peth': { lat: 17.659, lng: 75.906 },
};

/** Society offsets from area center (km-scale jitter) */
export const SOCIETY_OFFSETS: Record<string, { dLat: number; dLng: number }> = {
  'Pride Purple Park': { dLat: 0.004, dLng: 0.003 },
  'Green Valley Society': { dLat: -0.003, dLng: 0.005 },
  'Mont Vert Avion': { dLat: 0.002, dLng: -0.004 },
  Megapolis: { dLat: 0.003, dLng: 0.002 },
  'Blue Ridge': { dLat: -0.002, dLng: 0.004 },
  'Beverly Hills': { dLat: 0.005, dLng: -0.002 },
  'Pancard Club': { dLat: -0.004, dLng: 0.003 },
  'World Trade Center Residency': { dLat: 0.002, dLng: 0.005 },
  'Nyati Epiphany': { dLat: -0.003, dLng: -0.003 },
  'Lokhandwala Complex': { dLat: 0.004, dLng: 0.002 },
  'Oshiwara Heights': { dLat: -0.003, dLng: 0.004 },
  'Hiranandani Gardens': { dLat: 0.003, dLng: -0.003 },
  'Lake Homes': { dLat: -0.004, dLng: 0.002 },
  'Pali Hill': { dLat: 0.005, dLng: 0.003 },
  'Bandra West Society': { dLat: -0.002, dLng: -0.004 },
  'Civil Lines Society': { dLat: 0.003, dLng: 0.002 },
  'Dharampeth Greens': { dLat: -0.003, dLng: 0.004 },
  'Sitabuldi Heights': { dLat: 0.004, dLng: -0.002 },
  'Central Nagpur Society': { dLat: -0.002, dLng: 0.005 },
  'Green Park': { dLat: 0.003, dLng: 0.003 },
  'Nashik Hills': { dLat: -0.004, dLng: 0.002 },
  'CIDCO Phase 1': { dLat: 0.002, dLng: 0.004 },
  'Prozone Area': { dLat: -0.003, dLng: -0.003 },
  'Royal Society': { dLat: 0.004, dLng: 0.002 },
  'Kolhapur Greens': { dLat: -0.002, dLng: 0.005 },
  'Hiranandani Estate': { dLat: 0.003, dLng: -0.004 },
  'Lodha Amara': { dLat: -0.004, dLng: 0.003 },
  'Solapur Central': { dLat: 0.002, dLng: 0.004 },
  'Green City': { dLat: -0.003, dLng: -0.002 },
};

export function coordsFor(name: string, type: string, areaName?: string): { lat: number; lng: number } | undefined {
  if (type === 'society' && areaName) {
    const area = LOCATION_COORDS[areaName];
    const off = SOCIETY_OFFSETS[name];
    if (area && off) {
      return { lat: area.lat + off.dLat, lng: area.lng + off.dLng };
    }
  }
  return LOCATION_COORDS[name];
}
