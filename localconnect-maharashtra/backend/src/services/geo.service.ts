/** Haversine distance in kilometers between two WGS84 points */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Stable small offset from id so markers at same location don't stack */
export function markerOffset(id: string, scale = 0.002): { lat: number; lng: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
  const angle = (Math.abs(h) % 360) * (Math.PI / 180);
  return {
    lat: Math.sin(angle) * scale,
    lng: Math.cos(angle) * scale,
  };
}

export function resolveCoords(
  lat: number | null | undefined,
  lng: number | null | undefined,
  id: string,
  fallback?: { lat: number; lng: number },
): { lat: number; lng: number } | null {
  if (lat != null && lng != null) {
    const off = markerOffset(id, 0.0008);
    return { lat: lat + off.lat, lng: lng + off.lng };
  }
  if (fallback) {
    const off = markerOffset(id, 0.0015);
    return { lat: fallback.lat + off.lat, lng: fallback.lng + off.lng };
  }
  return null;
}
