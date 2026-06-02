import type mapboxgl from "mapbox-gl";
import type { Zone } from "@/domain/types";
import type { Report } from "@/domain/types";
import { circlePolygon, ZONE_RADIUS_KM, normalizeReportCoordinates } from "@/lib/geo";

export const ZONES_SOURCE_ID = "demarcated-zones";
export const RADIUS_SOURCE_ID = "zone-radius-areas";

const FILL_LAYER_ID = "demarcated-zones-fill";
const LINE_LAYER_ID = "demarcated-zones-line";
const RADIUS_FILL_ID = "zone-radius-fill";
const RADIUS_LINE_ID = "zone-radius-line";

const ZONE_PALETTE = [
  "#38bdf8",
  "#fbbf24",
  "#a78bfa",
  "#fb7185",
  "#fdba74",
  "#34d399",
];

/** Centroide [lng, lat] de los reportes de una zona */
export function zoneCentroidFromReports(reports: Report[]): [number, number] | null {
  const positions: [number, number][] = [];
  for (const report of reports) {
    const pos = normalizeReportCoordinates(report.coordinates);
    if (pos) positions.push(pos);
  }
  if (!positions.length) return null;

  const lng = positions.reduce((sum, p) => sum + p[0], 0) / positions.length;
  const lat = positions.reduce((sum, p) => sum + p[1], 0) / positions.length;
  return [lng, lat];
}

function zonePolygonFeature(
  zoneName: string,
  centerLng: number,
  centerLat: number,
  color: string,
  zoneId?: number,
): GeoJSON.Feature {
  return {
    type: "Feature",
    properties: {
      zoneName,
      id: zoneId,
      color,
      radiusKm: ZONE_RADIUS_KM,
    },
    geometry: {
      type: "Polygon",
      coordinates: [circlePolygon(centerLng, centerLat, ZONE_RADIUS_KM)],
    },
  };
}

/** Un círculo de 2 km por zona activa (no por alerta individual) */
export function buildZoneAreasGeoJson(
  activeZoneNames: Set<string>,
  allReports: Report[],
  colorByZone: Record<string, string>,
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  activeZoneNames.forEach((zoneName) => {
    const color = colorByZone[zoneName] ?? "#3b82f6";
    const inZone = allReports.filter(
      (r) => (r.zone?.trim() || "Zona desconocida") === zoneName,
    );
    const center = zoneCentroidFromReports(inZone);
    if (!center) return;

    const [lng, lat] = center;
    features.push(zonePolygonFeature(zoneName, lng, lat, color));
  });

  return { type: "FeatureCollection", features };
}

/** Zonas guardadas en servidor (ya son un polígono por zona) */
export function buildSavedZonesGeoJson(
  zones: Zone[],
  visibleIds: Set<number>,
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = zones
    .filter((z) => visibleIds.has(z.id))
    .map((z) => ({
      type: "Feature" as const,
      properties: { id: z.id, name: z.name, color: z.color, zoneName: z.name },
      geometry: {
        type: "Polygon" as const,
        coordinates: [z.coordinates],
      },
    }));

  return { type: "FeatureCollection", features };
}

export function getZoneColorMap(reports: Report[]): Record<string, string> {
  const map: Record<string, string> = {};
  const names = Array.from(
    new Set(reports.map((r) => r.zone?.trim() || "Zona desconocida")),
  ).sort();

  names.forEach((name, i) => {
    map[name] = ZONE_PALETTE[i % ZONE_PALETTE.length];
  });
  return map;
}

function ensureGeoJsonLayers(
  map: mapboxgl.Map,
  sourceId: string,
  fillLayerId: string,
  lineLayerId: string,
  data: GeoJSON.FeatureCollection,
) {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, { type: "geojson", data });
    map.addLayer({
      id: fillLayerId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": 0.2,
      },
    });
    map.addLayer({
      id: lineLayerId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": ["get", "color"],
        "line-width": 2.5,
      },
    });
  } else {
    (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(data);
  }
}

/** Combina zonas por nombre (centroide) + zonas guardadas en un solo layer */
export function syncZoneAreasOnMap(
  map: mapboxgl.Map,
  options: {
    activeZoneNames: Set<string>;
    allReports: Report[];
    colorByZone: Record<string, string>;
    savedZones: Zone[];
    visibleSavedIds: Set<number>;
  },
) {
  const fromNames = buildZoneAreasGeoJson(
    options.activeZoneNames,
    options.allReports,
    options.colorByZone,
  );
  const fromSaved = buildSavedZonesGeoJson(options.savedZones, options.visibleSavedIds);

  const data: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [...fromNames.features, ...fromSaved.features],
  };

  ensureGeoJsonLayers(map, RADIUS_SOURCE_ID, RADIUS_FILL_ID, RADIUS_LINE_ID, data);

  if (map.getSource(ZONES_SOURCE_ID)) {
    const empty: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
    (map.getSource(ZONES_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(empty);
  }
}

export function clearZoneAreasOnMap(map: mapboxgl.Map) {
  const empty: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
  if (map.getSource(RADIUS_SOURCE_ID)) {
    (map.getSource(RADIUS_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(empty);
  }
}
