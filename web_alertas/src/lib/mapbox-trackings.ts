import type mapboxgl from "mapbox-gl";
import type { LiveTracking } from "@/domain/tracking";
import { bringReportMarkersToFront } from "@/lib/mapbox-reports";
import cochePoliciaIcon from "@/assets/coche-de-policia.png";
import camionBomberosIcon from "@/assets/camion-de-bomberos.png";
import ambulanciaIcon from "@/assets/ambulancia.png";

export const TRACKING_ROUTES_SOURCE_ID = "tracking-routes";
const TRACKING_ROUTES_LAYER_ID = "tracking-routes-line";
export const TRACKING_INCIDENTS_SOURCE_ID = "tracking-incidents";
const TRACKING_INCIDENTS_LAYER_ID = "tracking-incidents-pin";

function vehicleIconSrc(type?: string): string {
  const t = type?.toLowerCase() ?? "";
  if (t.includes("incendio") || t.includes("bombero")) return camionBomberosIcon;
  if (t.includes("medic") || t.includes("salud") || t.includes("ambulancia") || t.includes("paramedico")) return ambulanciaIcon;
  if (t.includes("polic")) return cochePoliciaIcon;
  return cochePoliciaIcon;
}

function createVehicleMarkerElement(tracking: LiveTracking, selected: boolean): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "tracking-vehicle-marker group cursor-pointer";
  el.style.border = "none";
  el.style.background = "transparent";
  el.style.padding = "0";
  el.title = tracking.description || tracking.type || "Unidad en ruta";

  const bg = selected ? "#22c55e" : "#3b82f6";
  el.innerHTML = `
    <div class="relative flex flex-col items-center transition-transform group-hover:scale-110">
      <div class="size-11 border-2 border-white shadow-lg grid place-items-center bg-card rounded-none"
           style="background:${bg}">
        <img src="${vehicleIconSrc(tracking.type)}" class="size-9 object-contain" />
      </div>
      <span class="mt-1 px-2 py-0.5 bg-background/90 border border-border text-[9px] font-bold uppercase tracking-wide text-foreground max-w-[120px] truncate rounded-none">
        ${tracking.type || "En ruta"}
      </span>
    </div>
  `;
  return el;
}

export function syncTrackingRouteLayers(map: mapboxgl.Map, trackings: LiveTracking[], selectedId: string | null) {
  const lineFeatures: GeoJSON.Feature[] = trackings
    .filter((t) => t.id === selectedId && t.route.length >= 2)
    .map((t) => ({
      type: "Feature" as const,
      properties: {
        id: t.id,
        type: t.type ?? "",
      },
      geometry: {
        type: "LineString" as const,
        coordinates: t.route.map((p) => [p.lng, p.lat]),
      },
    }));

  const incidentFeatures: GeoJSON.Feature[] = trackings
    .filter((t) => t.id === selectedId && t.incidentLatitude != null && t.incidentLongitude != null)
    .map((t) => ({
      type: "Feature" as const,
      properties: {
        id: t.id,
        reportId: t.reportId ?? "",
      },
      geometry: {
        type: "Point" as const,
        coordinates: [t.incidentLongitude!, t.incidentLatitude!],
      },
    }));

  const lineData: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: lineFeatures,
  };

  const incidentData: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: incidentFeatures,
  };

  if (!map.getSource(TRACKING_ROUTES_SOURCE_ID)) {
    map.addSource(TRACKING_ROUTES_SOURCE_ID, { type: "geojson", data: lineData });
    map.addLayer({
      id: TRACKING_ROUTES_LAYER_ID,
      type: "line",
      source: TRACKING_ROUTES_SOURCE_ID,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#3b82f6",
        "line-width": 5,
        "line-opacity": 0.85,
      },
    });
  } else {
    (map.getSource(TRACKING_ROUTES_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(lineData);
  }

  if (!map.getSource(TRACKING_INCIDENTS_SOURCE_ID)) {
    map.addSource(TRACKING_INCIDENTS_SOURCE_ID, { type: "geojson", data: incidentData });
    map.addLayer({
      id: TRACKING_INCIDENTS_LAYER_ID,
      type: "symbol",
      source: TRACKING_INCIDENTS_SOURCE_ID,
      layout: {
        "text-field": "🎯",
        "text-size": 22,
        "text-allow-overlap": true,
        "icon-allow-overlap": true,
      },
    });
  } else {
    (map.getSource(TRACKING_INCIDENTS_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(incidentData);
  }

  bringReportMarkersToFront(map);
}

export function clearTrackingRouteLayers(map: mapboxgl.Map) {
  if (map.getLayer(TRACKING_INCIDENTS_LAYER_ID)) map.removeLayer(TRACKING_INCIDENTS_LAYER_ID);
  if (map.getSource(TRACKING_INCIDENTS_SOURCE_ID)) map.removeSource(TRACKING_INCIDENTS_SOURCE_ID);
  if (map.getLayer(TRACKING_ROUTES_LAYER_ID)) map.removeLayer(TRACKING_ROUTES_LAYER_ID);
  if (map.getSource(TRACKING_ROUTES_SOURCE_ID)) map.removeSource(TRACKING_ROUTES_SOURCE_ID);
}

export function syncTrackingVehicleMarkers(
  map: mapboxgl.Map,
  mapboxglInstance: typeof mapboxgl,
  trackings: LiveTracking[],
  markersById: Map<string, mapboxgl.Marker>,
  selectedId: string | null,
  onSelect: (id: string) => void,
) {
  const activeIds = new Set(trackings.map((t) => t.id));

  for (const [id, marker] of markersById.entries()) {
    if (!activeIds.has(id)) {
      marker.remove();
      markersById.delete(id);
    }
  }

  for (const tracking of trackings) {
    const lngLat: [number, number] = [tracking.longitude, tracking.latitude];
    const existing = markersById.get(tracking.id);
    const selected = tracking.id === selectedId;

    if (existing) {
      existing.setLngLat(lngLat);
      const el = existing.getElement();
      if (el) {
        const next = createVehicleMarkerElement(tracking, selected);
        el.innerHTML = next.innerHTML;
        el.title = next.title;
      }
      continue;
    }

    const el = createVehicleMarkerElement(tracking, selected);
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onSelect(tracking.id);
      map.flyTo({
        center: lngLat,
        zoom: 15.5,
        pitch: 50,
        speed: 1.2,
      });
    });

    const marker = new mapboxglInstance.Marker({ element: el, anchor: "center" })
      .setLngLat(lngLat)
      .addTo(map);

    markersById.set(tracking.id, marker);
  }
}

export function clearTrackingVehicleMarkers(markersById: Map<string, mapboxgl.Marker>) {
  for (const marker of markersById.values()) {
    marker.remove();
  }
  markersById.clear();
}
