import { useEffect, useRef } from "react";
import {
  loadMapboxGl,
  MAPBOX_MAP_OPTIONS,
  MAPBOX_STYLE,
  burstMapResize,
} from "@/lib/mapbox";
import { cn } from "@/lib/utils";
import { normalizeReportCoordinates } from "@/lib/geo";

interface ReportLocationMapProps {
  coordinates: number[]; // [lng, lat]
  categoryName?: string;
  verified?: boolean;
  className?: string;
  resizeKey?: string | number | boolean;
}

export function ReportLocationMap({
  coordinates,
  categoryName,
  verified,
  className,
  resizeKey,
}: ReportLocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const normalized = normalizeReportCoordinates(coordinates) || [0, 0];
  const [lng, lat] = normalized;

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || !coordinates || coordinates.length < 2) return;

    let cancelled = false;
    let mapInstance: any;

    const init = async () => {
      const mapboxgl = await loadMapboxGl();
      if (cancelled || !containerRef.current) return;

      mapInstance = new mapboxgl.Map({
        container: containerRef.current,
        style: MAPBOX_STYLE,
        center: [lng, lat],
        zoom: 14.5,
        pitch: 45,
        bearing: -10,
        ...MAPBOX_MAP_OPTIONS,
      });

      mapRef.current = mapInstance;
      mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");

      mapInstance.on("load", () => {
        if (cancelled) return;

        // SVG and styling from categories
        const getStyles = (cat?: string) => {
          const name = cat?.toLowerCase() || "";
          if (name.includes("accidente")) {
            return {
              color: "#F43F5E",
              iconPaths: `<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>`
            };
          }
          if (name.includes("robo") || name.includes("asalto") || name.includes("seguridad")) {
            return {
              color: "#3B82F6",
              iconPaths: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`
            };
          }
          if (name.includes("incendio") || name.includes("fuego")) {
            return {
              color: "#F97316",
              iconPaths: `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>`
            };
          }
          if (name.includes("salud") || name.includes("médica") || name.includes("medica") || name.includes("enfermo") || name.includes("emergencia")) {
            return {
              color: "#10B981",
              iconPaths: `<path d="M19 10h-5V5c0-.6-.4-1-1-1h-2c-.6 0-1 .4-1 1v5H5c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1h5v5c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-5h5c.6 0 1-.4 1-1v-2c0-.6-.4-1-1-1z"/>`
            };
          }
          return {
            color: "#EF4444",
            iconPaths: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`
          };
        };

        const { color, iconPaths } = getStyles(categoryName);

        const el = document.createElement("div");
        el.className = "relative cursor-pointer";
        el.innerHTML = `
          <div class="flex items-center justify-center size-9 rounded-full bg-background border border-border shadow-md">
            <span style="color: ${color};" class="size-5 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                ${iconPaths}
              </svg>
            </span>
            ${!verified ? `<span class="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-amber-400 border border-background animate-pulse"></span>` : ""}
          </div>
        `;

        markerRef.current = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([lng, lat])
          .addTo(mapInstance);

        burstMapResize(mapInstance);
      });
    };

    init();

    return () => {
      cancelled = true;
      markerRef.current = null;
      mapInstance?.remove();
      mapRef.current = null;
    };
  }, [lng, lat, categoryName, verified]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    return burstMapResize(map);
  }, [resizeKey]);

  return (
    <div
      className={cn(
        "relative rounded-none overflow-hidden border border-border h-[240px] w-full",
        className,
      )}
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
