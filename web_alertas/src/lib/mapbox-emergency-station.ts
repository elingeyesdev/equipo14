import type mapboxgl from "mapbox-gl";
import type { EmergencyStation } from "@/domain/types";
import { emergencyStationsToGeoJson } from "@/lib/emergency-station";

export const STATIONS_SOURCE_ID = "emergency-stations";
const STATIONS_CIRCLE_LAYER = "emergency-stations-circle";
const STATIONS_LABEL_LAYER = "emergency-stations-label";

export function syncEmergencyStationsOnMap(map: mapboxgl.Map, stations: EmergencyStation[]) {
  const data = emergencyStationsToGeoJson(stations);

  if (!map.getSource(STATIONS_SOURCE_ID)) {
    map.addSource(STATIONS_SOURCE_ID, { type: "geojson", data });
    map.addLayer({
      id: STATIONS_CIRCLE_LAYER,
      type: "circle",
      source: STATIONS_SOURCE_ID,
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          5,
          14,
          9,
          17,
          12,
        ],
        "circle-color": ["get", "color"],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 0.92,
      },
    });
    map.addLayer({
      id: STATIONS_LABEL_LAYER,
      type: "symbol",
      source: STATIONS_SOURCE_ID,
      minzoom: 12,
      layout: {
        "text-field": ["concat", ["get", "label"], "\n", ["get", "name"]],
        "text-size": 10,
        "text-anchor": "top",
        "text-offset": [0, 1],
        "text-max-width": 14,
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#f8fafc",
        "text-halo-color": "#0f172a",
        "text-halo-width": 1.2,
      },
    });
  } else {
    (map.getSource(STATIONS_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(data);
  }
}

export function clearEmergencyStationsOnMap(map: mapboxgl.Map) {
  for (const id of [STATIONS_LABEL_LAYER, STATIONS_CIRCLE_LAYER]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(STATIONS_SOURCE_ID)) {
    map.removeSource(STATIONS_SOURCE_ID);
  }
}

export function emergencyStationLayerIds() {
  return [STATIONS_CIRCLE_LAYER, STATIONS_LABEL_LAYER];
}
