import { getMapboxToken } from "@/lib/mapbox";
import type { TrackingRoutePoint } from "@/domain/tracking";

export interface LngLat {
  lng: number;
  lat: number;
}

const routeCache = new Map<string, TrackingRoutePoint[]>();

function cacheKey(from: LngLat, to: LngLat): string {
  return `${from.lng.toFixed(4)},${from.lat.toFixed(4)}->${to.lng.toFixed(4)},${to.lat.toFixed(4)}`;
}

/** Ruta por calles usando Mapbox Directions (mismo criterio que la app móvil). */
export async function fetchDrivingRoute(
  from: LngLat,
  to: LngLat,
): Promise<TrackingRoutePoint[]> {
  const key = cacheKey(from, to);
  const cached = routeCache.get(key);
  if (cached) return cached;

  const token = getMapboxToken();
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?alternatives=false&geometries=geojson&overview=full&access_token=${token}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox directions ${response.status}`);
  }

  const data = (await response.json()) as {
    routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
  };

  const coords = data.routes?.[0]?.geometry?.coordinates;
  if (!coords?.length) {
    return [];
  }

  const route = coords.map(([lng, lat]) => ({ lat, lng }));
  routeCache.set(key, route);

  // Evitar crecimiento infinito del cache en demos largas
  if (routeCache.size > 80) {
    const first = routeCache.keys().next().value;
    if (first) routeCache.delete(first);
  }

  return route;
}

export function clearDrivingRouteCache() {
  routeCache.clear();
}
