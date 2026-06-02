/** Radio del área demarcada por zona (km) */
export const ZONE_RADIUS_KM = 2;

/** Límites aproximados de Santa Cruz de la Sierra (validar lng/lat) */
const SCZ = {
  lngMin: -63.55,
  lngMax: -62.75,
  latMin: -18.15,
  latMax: -17.35,
};

function inSantaCruzLng(v: number) {
  return v >= SCZ.lngMin && v <= SCZ.lngMax;
}

function inSantaCruzLat(v: number) {
  return v >= SCZ.latMin && v <= SCZ.latMax;
}

/**
 * Devuelve [lng, lat] corrigiendo inversiones frecuentes (PostGIS / apps móviles).
 */
export function normalizeReportCoordinates(coords: number[] | undefined): [number, number] | null {
  if (!coords || coords.length < 2) return null;
  const a = Number(coords[0]);
  const b = Number(coords[1]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

  const candidates: [number, number][] = [[a, b]];
  if (inSantaCruzLat(a) && inSantaCruzLng(b)) {
    candidates.push([b, a]);
  }

  for (const [lng, lat] of candidates) {
    if (inSantaCruzLng(lng) && inSantaCruzLat(lat)) {
      return [lng, lat];
    }
  }

  // GeoJSON estándar [lng, lat] aunque quede fuera del bbox local
  if (Math.abs(a) <= 180 && Math.abs(b) <= 90) {
    return [a, b];
  }

  return null;
}

/** Ray casting: punto [lng, lat] dentro de anillo cerrado */
export function pointInPolygon(lng: number, lat: number, ring: number[][]): boolean {
  if (ring.length < 3) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function findZoneNameAtPoint(
  lng: number,
  lat: number,
  zones: { name: string; coordinates: number[][] }[],
): string | null {
  for (const zone of zones) {
    if (pointInPolygon(lng, lat, zone.coordinates)) {
      return zone.name;
    }
  }
  return null;
}

/**
 * Anillo GeoJSON [lng,lat] de un círculo geodésico alrededor de un centro.
 */
export function circlePolygon(
  centerLng: number,
  centerLat: number,
  radiusKm: number = ZONE_RADIUS_KM,
  steps = 64,
): number[][] {
  const coords: number[][] = [];
  const earthRadiusKm = 6371;
  const angularDistance = radiusKm / earthRadiusKm;
  const lat1 = (centerLat * Math.PI) / 180;
  const lng1 = (centerLng * Math.PI) / 180;

  for (let i = 0; i <= steps; i++) {
    const bearing = (2 * Math.PI * i) / steps;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
        Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
        Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
      );
    coords.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }
  return coords;
}
