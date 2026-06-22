import type mapboxgl from "mapbox-gl";
import type { Report } from "@/domain/types";

export const REPORTS_SOURCE_ID = "report-markers";
const REPORTS_LAYER_ID = "report-markers-circles";
const REPORTS_PIN_LAYER_ID = "report-markers-pin";

export function syncReportMarkersLayer(map: mapboxgl.Map, reports: Report[]) {
  // Clear circle and symbol layers to avoid rendering redundant red dots or labels under custom pins
  if (map.getLayer(REPORTS_LAYER_ID)) map.removeLayer(REPORTS_LAYER_ID);
  if (map.getLayer(REPORTS_PIN_LAYER_ID)) map.removeLayer(REPORTS_PIN_LAYER_ID);
  if (map.getSource(REPORTS_SOURCE_ID)) map.removeSource(REPORTS_SOURCE_ID);
}

export function bringReportMarkersToFront(map: mapboxgl.Map) {
  const riskLayerIds = ["risk-zones-fill", "risk-zones-line", "risk-zones-label"];
  const reportLayerIds = [REPORTS_LAYER_ID, REPORTS_PIN_LAYER_ID];

  // Keep risk zones below report markers
  for (const riskId of riskLayerIds) {
    if (!map.getLayer(riskId)) continue;
    const beforeId = reportLayerIds.find((id) => map.getLayer(id));
    if (beforeId) {
      map.moveLayer(riskId, beforeId);
    }
  }

  for (const layerId of reportLayerIds) {
    if (map.getLayer(layerId)) {
      map.moveLayer(layerId);
    }
  }

  const markerRoot = map.getContainer().querySelector(
    ".mapboxgl-marker-container",
  ) as HTMLElement | null;
  if (markerRoot) {
    markerRoot.style.zIndex = "30";
    markerRoot.style.pointerEvents = "none";
    markerRoot.querySelectorAll(".mapboxgl-marker").forEach((el) => {
      const node = el as HTMLElement;
      node.style.pointerEvents = "auto";
      node.style.zIndex = "30";
    });
  }
}
