import type { Point } from 'geojson';

/** Extrae [lng, lat] desde PostGIS/GeoJSON (varios formatos de TypeORM). */
export function extractCoordinates(location: Point | string | null | undefined): number[] {
  if (!location) return [];

  if (typeof location === 'string') {
    return [];
  }

  const coords = (location as Point).coordinates;
  if (Array.isArray(coords) && coords.length >= 2) {
    return [Number(coords[0]), Number(coords[1])];
  }

  const anyLoc = location as { x?: number; y?: number; lng?: number; lat?: number };
  if (typeof anyLoc.lng === 'number' && typeof anyLoc.lat === 'number') {
    return [anyLoc.lng, anyLoc.lat];
  }
  if (typeof anyLoc.x === 'number' && typeof anyLoc.y === 'number') {
    return [anyLoc.x, anyLoc.y];
  }

  return [];
}
