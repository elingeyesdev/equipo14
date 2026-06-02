import type mapboxgl from "mapbox-gl";
import type { Report } from "@/domain/types";
import { normalizeReportCoordinates } from "@/lib/geo";

export const REPORTS_SOURCE_ID = "report-markers";
const REPORTS_LAYER_ID = "report-markers-circles";
const REPORTS_PIN_LAYER_ID = "report-markers-pin";

function categoryColor(typeName?: string): string {
  const t = typeName?.toLowerCase() || "";
  if (t.includes("robo") || t.includes("hurto") || t.includes("asalto")) return "#f43f5e";
  if (t.includes("incendio") || t.includes("fuego")) return "#f97316";
  if (t.includes("accidente") || t.includes("choque")) return "#f59e0b";
  return "#3b82f6";
}

export function syncReportMarkersLayer(map: mapboxgl.Map, reports: Report[]) {
  const features: GeoJSON.Feature[] = [];

  for (const report of reports) {
    const pos = normalizeReportCoordinates(report.coordinates);
    if (!pos) continue;
    const [lng, lat] = pos;
    features.push({
      type: "Feature",
      properties: {
        id: report.id,
        color: categoryColor(report.type?.name),
        verified: report.verified ? 1 : 0,
      },
      geometry: {
        type: "Point",
        coordinates: [lng, lat],
      },
    });
  }

  const data: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features,
  };

  if (!map.getSource(REPORTS_SOURCE_ID)) {
    map.addSource(REPORTS_SOURCE_ID, { type: "geojson", data });

    map.addLayer({
      id: REPORTS_LAYER_ID,
      type: "circle",
      source: REPORTS_SOURCE_ID,
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          7,
          14,
          11,
          16,
          14,
        ],
        "circle-color": ["get", "color"],
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 1,
      },
    });

    map.addLayer({
      id: REPORTS_PIN_LAYER_ID,
      type: "symbol",
      source: REPORTS_SOURCE_ID,
      layout: {
        "text-field": "📍",
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          14,
          14,
          20,
          16,
          24,
        ],
        "text-anchor": "bottom",
        "text-offset": [0, -0.6],
        "text-allow-overlap": true,
        "icon-allow-overlap": true,
      },
    });
  } else {
    (map.getSource(REPORTS_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(data);
  }

  bringReportMarkersToFront(map);
}

export function bringReportMarkersToFront(map: mapboxgl.Map) {
  for (const layerId of [REPORTS_LAYER_ID, REPORTS_PIN_LAYER_ID]) {
    if (map.getLayer(layerId)) {
      map.moveLayer(layerId);
    }
  }

  const markerRoot = map.getContainer().querySelector(
    ".mapboxgl-marker-container",
  ) as HTMLElement | null;
  if (markerRoot) {
    markerRoot.style.zIndex = "10";
    markerRoot.style.pointerEvents = "none";
    markerRoot.querySelectorAll(".mapboxgl-marker").forEach((el) => {
      (el as HTMLElement).style.pointerEvents = "auto";
    });
  }
}
