import type mapboxgl from "mapbox-gl";
import type { EmergencyFacility } from "@/domain/types";
import { facilitiesToGeoJson } from "@/lib/facilities";

export const FACILITIES_SOURCE_ID = "emergency-facilities";
const FACILITIES_CIRCLE_LAYER = "emergency-facilities-circle";
const FACILITIES_LABEL_LAYER = "emergency-facilities-label";

export function syncFacilitiesOnMap(map: mapboxgl.Map, facilities: EmergencyFacility[]) {
  const data = facilitiesToGeoJson(facilities);

  if (!map.getSource(FACILITIES_SOURCE_ID)) {
    map.addSource(FACILITIES_SOURCE_ID, { type: "geojson", data });
    map.addLayer({
      id: FACILITIES_CIRCLE_LAYER,
      type: "circle",
      source: FACILITIES_SOURCE_ID,
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
      id: FACILITIES_LABEL_LAYER,
      type: "symbol",
      source: FACILITIES_SOURCE_ID,
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
    (map.getSource(FACILITIES_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(data);
  }
}

export function clearFacilitiesOnMap(map: mapboxgl.Map) {
  for (const id of [FACILITIES_LABEL_LAYER, FACILITIES_CIRCLE_LAYER]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(FACILITIES_SOURCE_ID)) {
    map.removeSource(FACILITIES_SOURCE_ID);
  }
}

export function facilityLayerIds() {
  return [FACILITIES_CIRCLE_LAYER, FACILITIES_LABEL_LAYER];
}
