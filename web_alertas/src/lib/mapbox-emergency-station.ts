import type mapboxgl from "mapbox-gl";
import type { EmergencyStation } from "@/domain/types";
import comisariaIcon from "@/assets/comisaria-de-policia.png";
import bomberoIcon from "@/assets/bombero.png";
import hospitalIcon from "@/assets/hospital.png";

function stationIconSrc(type: string): string {
  const t = type.toLowerCase();
  if (t === "policia") return comisariaIcon;
  if (t === "bombero") return bomberoIcon;
  if (t === "hospital") return hospitalIcon;
  return comisariaIcon;
}

function createStationMarkerElement(station: EmergencyStation): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "emergency-station-marker group cursor-pointer";
  el.style.border = "none";
  el.style.background = "transparent";
  el.style.padding = "0";
  el.title = station.name;

  el.innerHTML = `
    <div class="relative flex flex-col items-center transition-transform group-hover:scale-110">
      <div class="size-9 bg-card border border-border shadow-md grid place-items-center rounded-none">
        <img src="${stationIconSrc(station.installation_type)}" class="size-7 object-contain" />
      </div>
      <span class="mt-1 px-1.5 py-0.5 bg-background/90 border border-border text-[8px] font-bold uppercase tracking-wide text-foreground max-w-[100px] truncate rounded-none">
        ${station.name}
      </span>
    </div>
  `;
  return el;
}

export function syncEmergencyStationsOnMap(
  map: mapboxgl.Map,
  mapboxglInstance: typeof mapboxgl,
  stations: EmergencyStation[],
  markersById: Map<number, mapboxgl.Marker>,
) {
  const activeIds = new Set(stations.map((s) => s.id));

  for (const [id, marker] of markersById.entries()) {
    if (!activeIds.has(id)) {
      marker.remove();
      markersById.delete(id);
    }
  }

  stations.forEach((station) => {
    if (station.coordinates.length < 2 || station.coordinates[0] === 0 || station.coordinates[1] === 0) return;
    const lngLat: [number, number] = [station.coordinates[0], station.coordinates[1]];

    const existing = markersById.get(station.id);
    if (existing) {
      existing.setLngLat(lngLat);
      return;
    }

    const el = createStationMarkerElement(station);
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
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

    markersById.set(station.id, marker);
  });
}

export function clearEmergencyStationsOnMap(markersById: Map<number, mapboxgl.Marker>) {
  for (const marker of markersById.values()) {
    marker.remove();
  }
  markersById.clear();
}
