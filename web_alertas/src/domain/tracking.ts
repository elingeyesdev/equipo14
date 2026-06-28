export interface TrackingRoutePoint {
  lat: number;
  lng: number;
}

export interface LiveTracking {
  id: string;
  latitude: number;
  longitude: number;
  incidentLatitude?: number;
  incidentLongitude?: number;
  reportId?: number;
  type?: string;
  description?: string;
  route: TrackingRoutePoint[];
  status?: string;
  profileType?: string;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function parseLiveTracking(id: string, raw: Record<string, unknown>): LiveTracking | null {
  const latitude = toNumber(raw.latitude);
  const longitude = toNumber(raw.longitude);
  if (latitude == null || longitude == null) return null;

  const routeRaw = Array.isArray(raw.route) ? raw.route : [];
  const route: TrackingRoutePoint[] = routeRaw
    .map((point) => {
      if (!point || typeof point !== "object") return null;
      const p = point as Record<string, unknown>;
      const lat = toNumber(p.lat);
      const lng = toNumber(p.lng);
      if (lat == null || lng == null) return null;
      return { lat, lng };
    })
    .filter((p): p is TrackingRoutePoint => p != null);

  return {
    id,
    latitude,
    longitude,
    incidentLatitude: toNumber(raw.incidentLatitude) ?? undefined,
    incidentLongitude: toNumber(raw.incidentLongitude) ?? undefined,
    reportId: toNumber(raw.reportId) ?? undefined,
    type: typeof raw.type === "string" ? raw.type : undefined,
    description: typeof raw.description === "string" ? raw.description : undefined,
    route,
    status: typeof raw.status === "string" ? raw.status : undefined,
    profileType: typeof raw.profileType === "string" ? raw.profileType : undefined,
  };
}
