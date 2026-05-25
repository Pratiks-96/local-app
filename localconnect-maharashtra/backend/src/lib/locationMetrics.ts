import { prisma } from './prisma';

export interface LocationLabels {
  city: string;
  area: string;
  society: string;
}

/** Resolve society → area → city labels for Prometheus metrics */
export async function getLocationLabels(locationId: string): Promise<LocationLabels> {
  const loc = await prisma.location.findUnique({
    where: { id: locationId },
    include: { parent: { include: { parent: { include: { parent: true } } } } },
  });

  if (!loc) {
    return { city: 'unknown', area: 'unknown', society: 'unknown' };
  }

  if (loc.type === 'society') {
    return {
      city: loc.parent?.parent?.name || 'unknown',
      area: loc.parent?.name || 'unknown',
      society: loc.name,
    };
  }

  if (loc.type === 'area') {
    return {
      city: loc.parent?.name || 'unknown',
      area: loc.name,
      society: loc.name,
    };
  }

  if (loc.type === 'city') {
    return { city: loc.name, area: loc.name, society: loc.name };
  }

  return { city: loc.name, area: 'unknown', society: 'unknown' };
}

export async function loadUsersByLocation(): Promise<
  Array<LocationLabels & { count: number }>
> {
  const grouped = await prisma.user.groupBy({
    by: ['locationId'],
    _count: { id: true },
    where: { isActive: true, locationId: { not: null } },
  });

  const result: Array<LocationLabels & { count: number }> = [];
  for (const row of grouped) {
    if (!row.locationId) continue;
    const labels = await getLocationLabels(row.locationId);
    result.push({ ...labels, count: row._count.id });
  }
  return result;
}

export async function loadPostsByLocation(): Promise<
  Array<LocationLabels & { count: number }>
> {
  const grouped = await prisma.post.groupBy({
    by: ['locationId'],
    _count: { id: true },
    where: { status: 'ACTIVE' },
  });

  const result: Array<LocationLabels & { count: number }> = [];
  for (const row of grouped) {
    const labels = await getLocationLabels(row.locationId);
    result.push({ ...labels, count: row._count.id });
  }
  return result;
}
