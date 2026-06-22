import { useEffect } from "react";
import type { LiveTracking } from "@/domain/tracking";
import { loadMapboxGl } from "@/lib/mapbox";
import {
  clearTrackingRouteLayers,
  clearTrackingVehicleMarkers,
  syncTrackingRouteLayers,
  syncTrackingVehicleMarkers,
} from "@/lib/mapbox-trackings";

export function useMapboxTrackings(
  map: any,
  trackings: LiveTracking[],
  enabled: boolean,
  markersByIdRef: React.RefObject<Map<string, any>>,
  selectedId: string | null,
  onSelect: (id: string) => void,
  isMapReady: boolean,
) {
  useEffect(() => {
    if (!map || !isMapReady) return;

    let active = true;

    const sync = async () => {
      if (!enabled || trackings.length === 0) {
        clearTrackingRouteLayers(map);
        if (markersByIdRef.current) {
          clearTrackingVehicleMarkers(markersByIdRef.current);
        }
        return;
      }

      syncTrackingRouteLayers(map, trackings, selectedId);

      const mapboxgl = await loadMapboxGl();
      if (!active) return;
      if (markersByIdRef.current) {
        syncTrackingVehicleMarkers(
          map,
          mapboxgl,
          trackings,
          markersByIdRef.current,
          selectedId,
          onSelect,
        );
      }
    };

    void sync();

    return () => {
      active = false;
    };
  }, [map, isMapReady, trackings, enabled, markersByIdRef, selectedId, onSelect]);

  // Clean up markers and route layers when map changes or component unmounts
  useEffect(() => {
    return () => {
      if (markersByIdRef.current) {
        clearTrackingVehicleMarkers(markersByIdRef.current);
      }
      if (map) {
        try {
          clearTrackingRouteLayers(map);
        } catch (e) {
          // ignore if map style is already removed or unmounted
        }
      }
    };
  }, [map, markersByIdRef]);
}
