import type mapboxgl from "mapbox-gl";
import { riskZonesToGeoJson, type RiskZone } from "@/lib/risk-zones";

export const RISK_ZONES_SOURCE_ID = "risk-zones";
const RISK_FILL_LAYER_ID = "risk-zones-fill";
const RISK_LINE_LAYER_ID = "risk-zones-line";
const RISK_LABEL_LAYER_ID = "risk-zones-label";

function riskZoneCentroids(zones: RiskZone[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: zones.map((z) => ({
      type: "Feature",
      properties: {
        name: z.name,
        riskIndex: z.riskIndex,
        reportCount: z.reportCount,
        label: `${Math.round(z.riskIndex * 100)}%`,
      },
      geometry: {
        type: "Point",
        coordinates: [z.lng, z.lat],
      },
    })),
  };
}

export function syncRiskZonesOnMap(map: mapboxgl.Map, zones: RiskZone[]) {
  const polygonData = riskZonesToGeoJson(zones);
  const labelData = riskZoneCentroids(zones);

  if (!map.getSource(RISK_ZONES_SOURCE_ID)) {
    map.addSource(RISK_ZONES_SOURCE_ID, { type: "geojson", data: polygonData });
    map.addLayer({
      id: RISK_FILL_LAYER_ID,
      type: "fill",
      source: RISK_ZONES_SOURCE_ID,
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": ["get", "fillOpacity"],
      },
    });
    map.addLayer({
      id: RISK_LINE_LAYER_ID,
      type: "line",
      source: RISK_ZONES_SOURCE_ID,
      filter: ["==", ["get", "ring"], "outer"],
      paint: {
        "line-color": ["get", "color"],
        "line-width": 2,
        "line-opacity": 0.85,
      },
    });

    map.addSource(`${RISK_ZONES_SOURCE_ID}-labels`, {
      type: "geojson",
      data: labelData,
    });
    map.addLayer({
      id: RISK_LABEL_LAYER_ID,
      type: "symbol",
      source: `${RISK_ZONES_SOURCE_ID}-labels`,
      minzoom: 11,
      layout: {
        "text-field": ["concat", ["get", "name"], "\n", ["get", "label"]],
        "text-size": 11,
        "text-anchor": "center",
        "text-max-width": 14,
      },
      paint: {
        "text-color": "#f8fafc",
        "text-halo-color": "#0f172a",
        "text-halo-width": 1.2,
      },
    });
  } else {
    (map.getSource(RISK_ZONES_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(polygonData);
    (map.getSource(`${RISK_ZONES_SOURCE_ID}-labels`) as mapboxgl.GeoJSONSource).setData(
      labelData,
    );
  }
}

export function clearRiskZonesOnMap(map: mapboxgl.Map) {
  const empty: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
  if (map.getSource(RISK_ZONES_SOURCE_ID)) {
    (map.getSource(RISK_ZONES_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(empty);
  }
  if (map.getSource(`${RISK_ZONES_SOURCE_ID}-labels`)) {
    (map.getSource(`${RISK_ZONES_SOURCE_ID}-labels`) as mapboxgl.GeoJSONSource).setData(empty);
  }
}
