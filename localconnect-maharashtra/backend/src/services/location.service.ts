import { prisma } from '../lib/prisma';
import { cacheGet, cacheSet } from '../lib/redis';

export async function getLocationTree() {
  const cached = await cacheGet<unknown>('locations:tree');
  if (cached) return cached;

  const state = await prisma.location.findFirst({
    where: { type: 'state', name: 'Maharashtra' },
    include: {
      children: {
        include: {
          children: {
            include: { children: true },
          },
        },
      },
    },
  });

  await cacheSet('locations:tree', state, 3600);
  return state;
}

export async function getNearbyLocationIds(locationId: string): Promise<string[]> {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { parent: { include: { parent: true } } },
  });
  if (!location) return [locationId];

  const ids = [locationId];

  // Include sibling societies in same area
  if (location.type === 'society' && location.parentId) {
    const siblings = await prisma.location.findMany({
      where: { parentId: location.parentId, type: 'society' },
      select: { id: true },
    });
    ids.push(...siblings.map((s) => s.id));

    // Include parent area
    ids.push(location.parentId);
  }

  // Include all societies in user's area
  if (location.type === 'area') {
    const societies = await prisma.location.findMany({
      where: { parentId: location.id, type: 'society' },
      select: { id: true },
    });
    ids.push(...societies.map((s) => s.id));
  }

  return [...new Set(ids)];
}

export async function searchLocations(query: string) {
  return prisma.location.findMany({
    where: {
      name: { contains: query, mode: 'insensitive' },
    },
    take: 20,
    include: {
      parent: { include: { parent: { include: { parent: true } } } },
    },
  });
}
