import type { Report } from "@/domain/types";
import { circlePolygon, normalizeReportCoordinates } from "@/lib/geo";

/** Tamaño de celda para agrupar incidentes (~250 m) */
export const RISK_GRID_KM = 0.25;

/** Radio mínimo/máximo del círculo de zona (km) */
const MIN_RADIUS_KM = 0.08;
const MAX_RADIUS_KM = 0.22;

export interface RiskZone {
  id: string;
  name: string;
  lng: number;
  lat: number;
  radiusKm: number;
  reportCount: number;
  accidentCount: number;
  riskScore: number;
  /** 0 = bajo (verde), 1 = alto (rojo) */
  riskIndex: number;
  color: string;
  reports: Report[];
}

const ACCIDENT_HINTS = ["accidente", "choque", "colisión", "tránsito", "transito"];

function kmPerDegree(lat: number) {
  return {
    lat: 111.32,
    lng: 111.32 * Math.cos((lat * Math.PI) / 180),
  };
}

function gridKey(lng: number, lat: number): string {
  const scale = kmPerDegree(lat);
  const gx = Math.floor((lng * scale.lng) / RISK_GRID_KM);
  const gy = Math.floor((lat * scale.lat) / RISK_GRID_KM);
  return `${gx}:${gy}`;
}

function isAccidentReport(report: Report): boolean {
  const name = (report.type?.name ?? "").toLowerCase();
  return ACCIDENT_HINTS.some((hint) => name.includes(hint));
}

function reportRiskWeight(report: Report): number {
  let w = report.weight || 1;
  if (isAccidentReport(report)) w *= 1.6;
  if (!report.verified) w *= 1.15;
  return w;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function lerpRgb(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number,
): string {
  const r = Math.round(lerp(c1[0], c2[0], t));
  const g = Math.round(lerp(c1[1], c2[1], t));
  const b = Math.round(lerp(c1[2], c2[2], t));
  return `rgb(${r}, ${g}, ${b})`;
}

/** Verde → amarillo → rojo según índice normalizado */
export function riskIndexToColor(index: number): string {
  const t = Math.max(0, Math.min(1, index));
  const green: [number, number, number] = [34, 197, 94];
  const yellow: [number, number, number] = [234, 179, 8];
  const red: [number, number, number] = [239, 68, 68];

  if (t <= 0.5) return lerpRgb(green, yellow, t * 2);
  return lerpRgb(yellow, red, (t - 0.5) * 2);
}

function dominantZoneLabel(reports: Report[]): string {
  const counts = new Map<string, number>();
  for (const r of reports) {
    const label = r.zone?.trim() || "Zona sin nombre";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  let best = "Área de riesgo";
  let max = 0;
  counts.forEach((n, label) => {
    if (n > max) {
      max = n;
      best = label;
    }
  });
  return best;
}

function radiusFromCount(count: number): number {
  const t = Math.min(1, count / 12);
  return MIN_RADIUS_KM + t * (MAX_RADIUS_KM - MIN_RADIUS_KM);
}

/**
 * Agrupa reportes en celdas geográficas y calcula índice de riesgo por área.
 */
export function buildRiskZonesFromReports(reports: Report[]): RiskZone[] {
  const buckets = new Map<string, { reports: Report[]; lngSum: number; latSum: number; n: number }>();

  for (const report of reports) {
    const pos = normalizeReportCoordinates(report.coordinates);
    if (!pos) continue;
    const [lng, lat] = pos;
    const key = gridKey(lng, lat);
    const bucket = buckets.get(key) ?? { reports: [], lngSum: 0, latSum: 0, n: 0 };
    bucket.reports.push(report);
    bucket.lngSum += lng;
    bucket.latSum += lat;
    bucket.n += 1;
    buckets.set(key, bucket);
  }

  const zones: RiskZone[] = [];
  let maxScore = 0;

  buckets.forEach((bucket, key) => {
    if (bucket.n === 0) return;
    const lng = bucket.lngSum / bucket.n;
    const lat = bucket.latSum / bucket.n;
    const accidentCount = bucket.reports.filter(isAccidentReport).length;
    const riskScore = bucket.reports.reduce((sum, r) => sum + reportRiskWeight(r), 0);
    maxScore = Math.max(maxScore, riskScore);

    zones.push({
      id: key,
      name: dominantZoneLabel(bucket.reports),
      lng,
      lat,
      radiusKm: radiusFromCount(bucket.n),
      reportCount: bucket.n,
      accidentCount,
      riskScore,
      riskIndex: 0,
      color: riskIndexToColor(0),
      reports: bucket.reports,
    });
  });

  if (maxScore <= 0) return zones;

  return zones
    .map((z) => {
      const riskIndex = z.riskScore / maxScore;
      return {
        ...z,
        riskIndex,
        color: riskIndexToColor(riskIndex),
      };
    })
    .sort((a, b) => b.riskIndex - a.riskIndex);
}

export function riskZonesToGeoJson(zones: RiskZone[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const zone of zones) {
    // Anillo exterior (más rojo / intenso en zonas críticas)
    features.push({
      type: "Feature",
      properties: {
        id: zone.id,
        name: zone.name,
        color: zone.color,
        riskIndex: zone.riskIndex,
        reportCount: zone.reportCount,
        accidentCount: zone.accidentCount,
        ring: "outer",
        fillOpacity: 0.08 + zone.riskIndex * 0.22,
      },
      geometry: {
        type: "Polygon",
        coordinates: [circlePolygon(zone.lng, zone.lat, zone.radiusKm)],
      },
    });

    // Anillo medio — transición
    const midRadius = zone.radiusKm * 0.62;
    features.push({
      type: "Feature",
      properties: {
        id: `${zone.id}-mid`,
        name: zone.name,
        color: riskIndexToColor(Math.max(0, zone.riskIndex - 0.15)),
        riskIndex: zone.riskIndex,
        reportCount: zone.reportCount,
        accidentCount: zone.accidentCount,
        ring: "mid",
        fillOpacity: 0.12 + zone.riskIndex * 0.28,
      },
      geometry: {
        type: "Polygon",
        coordinates: [circlePolygon(zone.lng, zone.lat, midRadius)],
      },
    });

    // Núcleo — verde en zonas bajas, rojo en zonas altas
    const coreRadius = zone.radiusKm * 0.32;
    features.push({
      type: "Feature",
      properties: {
        id: `${zone.id}-core`,
        name: zone.name,
        color: zone.color,
        riskIndex: zone.riskIndex,
        reportCount: zone.reportCount,
        accidentCount: zone.accidentCount,
        ring: "core",
        fillOpacity: 0.18 + zone.riskIndex * 0.35,
      },
      geometry: {
        type: "Polygon",
        coordinates: [circlePolygon(zone.lng, zone.lat, coreRadius)],
      },
    });
  }

  return { type: "FeatureCollection", features };
}
