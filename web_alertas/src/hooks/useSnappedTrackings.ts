import { useEffect, useRef, useState } from "react";
import type { LiveTracking } from "@/domain/tracking";
import { fetchDrivingRoute } from "@/lib/mapbox-directions";

function trackingDest(t: LiveTracking): { lat: number; lng: number } | null {
  if (t.incidentLatitude != null && t.incidentLongitude != null) {
    return { lat: t.incidentLatitude, lng: t.incidentLongitude };
  }
  const last = t.route.at(-1);
  return last ?? null;
}

/** Reemplaza la polyline recta por ruta Mapbox que sigue calles. */
export function useSnappedTrackings(trackings: LiveTracking[], enabled: boolean) {
  const [displayTrackings, setDisplayTrackings] = useState<LiveTracking[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!enabled || trackings.length === 0) {
      setDisplayTrackings([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const requestId = ++requestIdRef.current;

      void (async () => {
        const snapped = await Promise.all(
          trackings.map(async (tracking) => {
            const dest = trackingDest(tracking);
            if (!dest) return tracking;

            const from = { lng: tracking.longitude, lat: tracking.latitude };
            const to = { lng: dest.lng, lat: dest.lat };

            // Muy cerca del destino: sin línea
            const dLat = from.lat - to.lat;
            const dLng = from.lng - to.lng;
            if (dLat * dLat + dLng * dLng < 1e-8) {
              return { ...tracking, route: [] };
            }

            try {
              const roadRoute = await fetchDrivingRoute(from, to);
              if (roadRoute.length >= 2) {
                return { ...tracking, route: roadRoute };
              }
            } catch (err) {
              console.warn("[tracking] No se pudo calcular ruta por calles:", err);
            }

            return tracking;
          }),
        );

        if (requestId === requestIdRef.current) {
          setDisplayTrackings(snapped);
        }
      })();
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [trackings, enabled]);

  if (!enabled) return [];
  if (displayTrackings.length > 0) return displayTrackings;
  // Mientras Mapbox calcula, no dibujar líneas rectas provisionales
  return trackings.map((t) => ({ ...t, route: [] }));
}
