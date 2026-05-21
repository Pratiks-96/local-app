import { prisma } from '../lib/prisma';
import { getNearbyLocationIds } from './location.service';
import { distanceKm, resolveCoords } from './geo.service';
import { nearbyPlaces, isPlacesConfigured } from './osmPlaces.service';

export interface MapMarker {
  id: string;
  type: 'post' | 'marketplace' | 'society' | 'place';
  title: string;
  subtitle?: string;
  lat: number;
  lng: number;
  category?: string;
  link?: string;
  meta?: Record<string, unknown>;
}

export async function findNearestSociety(lat: number, lng: number) {
  const societies = await prisma.location.findMany({
    where: { type: 'society', latitude: { not: null }, longitude: { not: null } },
    include: {
      parent: { include: { parent: { include: { parent: true } } } },
    },
  });

  let best: (typeof societies)[0] | null = null;
  let bestDist = Infinity;

  for (const s of societies) {
    if (s.latitude == null || s.longitude == null) continue;
    const d = distanceKm(lat, lng, s.latitude, s.longitude);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }

  if (!best) return null;

  const area = best.parent;
  const city = area?.parent;
  const state = city?.parent;

  return {
    locationId: best.id,
    distanceKm: Math.round(bestDist * 100) / 100,
    society: best.name,
    area: area?.name,
    city: city?.name,
    state: state?.name,
    path: [state?.name, city?.name, area?.name, best.name].filter(Boolean).join(' › '),
  };
}

export async function getMapContent(options: {
  userId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  includeGooglePlaces?: boolean;
}) {
  const radiusKm = options.radiusKm ?? 8;
  let centerLat = options.lat;
  let centerLng = options.lng;
  let locationIds: string[] = [];

  if (options.userId) {
    const user = await prisma.user.findUnique({
      where: { id: options.userId },
      include: { location: true },
    });
    if (user?.location) {
      locationIds = await getNearbyLocationIds(user.locationId);
      if (centerLat == null && user.location.latitude != null) {
        centerLat = user.location.latitude;
        centerLng = user.location.longitude ?? undefined;
      }
      if (centerLat == null) {
        const area = await prisma.location.findUnique({
          where: { id: user.location.parentId || user.locationId },
        });
        if (area?.latitude != null) {
          centerLat = area.latitude;
          centerLng = area.longitude ?? undefined;
        }
      }
    }
  }

  if (centerLat == null || centerLng == null) {
    centerLat = 18.5204;
    centerLng = 73.8567;
  }

  const markers: MapMarker[] = [];

  const postWhere =
    locationIds.length > 0
      ? { locationId: { in: locationIds }, status: 'ACTIVE' as const }
      : { status: 'ACTIVE' as const };

  const posts = await prisma.post.findMany({
    where: postWhere,
    take: 80,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      location: { select: { id: true, name: true, latitude: true, longitude: true, type: true } },
    },
  });

  for (const post of posts) {
    const coords = resolveCoords(
      post.location.latitude,
      post.location.longitude,
      post.id,
    );
    if (!coords) continue;
    if (distanceKm(centerLat, centerLng, coords.lat, coords.lng) > radiusKm) continue;

    markers.push({
      id: post.id,
      type: 'post',
      title: post.title || post.content.slice(0, 60),
      subtitle: `${post.author.firstName} ${post.author.lastName} · ${post.location.name}`,
      lat: coords.lat,
      lng: coords.lng,
      category: post.category,
      link: `/posts/${post.id}`,
    });
  }

  const marketplace = await prisma.marketplaceItem.findMany({
    where: { isSold: false },
    take: 40,
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          location: { select: { id: true, name: true, latitude: true, longitude: true } },
        },
      },
    },
  });

  for (const item of marketplace) {
    const loc = item.author.location;
    if (!loc) continue;
    if (locationIds.length > 0 && !locationIds.includes(loc.id)) continue;

    const coords = resolveCoords(loc.latitude, loc.longitude, item.id);
    if (!coords) continue;
    if (distanceKm(centerLat, centerLng, coords.lat, coords.lng) > radiusKm) continue;

    markers.push({
      id: item.id,
      type: 'marketplace',
      title: item.title,
      subtitle: `₹${item.price} · ${loc.name}`,
      lat: coords.lat,
      lng: coords.lng,
      link: '/marketplace',
      meta: { price: item.price },
    });
  }

  const societies = await prisma.location.findMany({
    where: {
      type: 'society',
      latitude: { not: null },
      longitude: { not: null },
    },
    include: { parent: { include: { parent: true } } },
  });

  for (const s of societies) {
    if (s.latitude == null || s.longitude == null) continue;
    if (distanceKm(centerLat, centerLng, s.latitude, s.longitude) > radiusKm) continue;

    markers.push({
      id: s.id,
      type: 'society',
      title: s.name,
      subtitle: [s.parent?.parent?.name, s.parent?.name].filter(Boolean).join(', '),
      lat: s.latitude,
      lng: s.longitude,
      meta: { locationId: s.id },
    });
  }

  let googlePlaces: Awaited<ReturnType<typeof nearbyPlaces>> = [];
  if (options.includeGooglePlaces !== false && isGoogleMapsConfigured()) {
    googlePlaces = await nearbyPlaces(centerLat, centerLng, Math.min(radiusKm * 1000, 5000));
    for (const p of googlePlaces) {
      markers.push({
        id: p.placeId,
        type: 'place',
        title: p.name,
        subtitle: p.vicinity,
        lat: p.lat,
        lng: p.lng,
        meta: { types: p.types, rating: p.rating },
      });
    }
  }

  return {
    center: { lat: centerLat, lng: centerLng },
    radiusKm,
    markers,
    osmPlacesEnabled: isPlacesConfigured(),
    mapProvider: 'openstreetmap' as const,
    stats: {
      posts: markers.filter((m) => m.type === 'post').length,
      marketplace: markers.filter((m) => m.type === 'marketplace').length,
      societies: markers.filter((m) => m.type === 'society').length,
      places: markers.filter((m) => m.type === 'place').length,
    },
  };
}
