import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import {
  loadMapboxGl,
  MAPBOX_MAP_OPTIONS,
  MAPBOX_STYLE,
  SANTA_CRUZ_CENTER,
  scheduleMapResize,
} from "@/lib/mapbox";
import { cn } from "@/lib/utils";

export interface MapLocation {
  latitude: number;
  longitude: number;
}

interface LocationPickerMapProps {
  value: MapLocation | null;
  onChange: (location: MapLocation) => void;
  className?: string;
  /** Llama a map.resize() cuando el contenedor cambia de tamaño (p. ej. sheet abierto) */
  resizeKey?: string | number | boolean;
}

export function LocationPickerMap({
  value,
  onChange,
  className,
  resizeKey,
}: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let cancelled = false;
    let mapInstance: any;

    const init = async () => {
      const mapboxgl = await loadMapboxGl();
      if (cancelled || !containerRef.current) return;

      mapInstance = new mapboxgl.Map({
        container: containerRef.current,
        style: MAPBOX_STYLE,
        center: value
          ? [value.longitude, value.latitude]
          : [SANTA_CRUZ_CENTER.lng, SANTA_CRUZ_CENTER.lat],
        zoom: value ? 14 : 12,
        pitch: 45,
        bearing: -12,
        ...MAPBOX_MAP_OPTIONS,
      });

      mapRef.current = mapInstance;

      mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");

      const placeMarker = (lng: number, lat: number) => {
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        } else {
          const el = document.createElement("div");
          el.innerHTML = `
            <div class="flex flex-col items-center pointer-events-none">
              <svg class="w-10 h-10 drop-shadow-lg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 13.5 12 21 12 21C12 21 19 13.5 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#3b82f6" stroke="#fff" stroke-width="1.2"/>
              </svg>
            </div>
          `;
          markerRef.current = new mapboxgl.Marker({ element: el, anchor: "bottom" })
            .setLngLat([lng, lat])
            .addTo(mapInstance);
        }
      };

      if (value) {
        mapInstance.on("load", () => placeMarker(value.longitude, value.latitude));
      }

      mapInstance.on("click", (e: any) => {
        const { lng, lat } = e.lngLat;
        placeMarker(lng, lat);
        onChange({ latitude: lat, longitude: lng });
      });

      mapInstance.on("load", () => {
        scheduleMapResize(mapInstance);
      });
    };

    init();

    return () => {
      cancelled = true;
      markerRef.current = null;
      mapInstance?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init map once
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !value) return;

    const update = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (markerRef.current) {
        markerRef.current.setLngLat([value.longitude, value.latitude]);
      } else if (map.loaded()) {
        const el = document.createElement("div");
        el.innerHTML = `<div class="w-3 h-3 rounded-full bg-primary border-2 border-white shadow"></div>`;
        markerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat([value.longitude, value.latitude])
          .addTo(map);
      }
      map.flyTo({
        center: [value.longitude, value.latitude],
        zoom: Math.max(map.getZoom(), 14),
        duration: 600,
      });
    };

    update();
  }, [value?.latitude, value?.longitude]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    return scheduleMapResize(map, 200);
  }, [resizeKey]);

  return (
    <div
      className={cn(
        "relative rounded-none overflow-hidden border border-border min-h-[220px]",
        className,
      )}
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute top-3 left-3 right-3 flex items-center gap-2 px-3 py-2 rounded-none bg-background/90 backdrop-blur border border-border text-[11px] text-muted-foreground z-10 pointer-events-none">
        <MapPin className="size-3.5 text-primary shrink-0" />
        Haz clic en el mapa para marcar la ubicación de la alerta
      </div>
      {value && (
        <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-none bg-background/90 backdrop-blur border border-border text-[10px] font-mono z-10 pointer-events-none">
          {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
        </div>
      )}
    </div>
  );
}
