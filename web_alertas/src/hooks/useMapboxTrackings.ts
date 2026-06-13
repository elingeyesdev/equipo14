import { useCallback, useEffect } from "react";
import type mapboxgl from "mapbox-gl";
import type { LiveTracking } from "@/domain/tracking";
import { loadMapboxGl } from "@/lib/mapbox";
import {
  clearTrackingRouteLayers,
  clearTrackingVehicleMarkers,
  syncTrackingRouteLayers,
  syncTrackingVehicleMarkers,
} from "@/lib/mapbox-trackings";

export function useMapboxTrackings(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  trackings: LiveTracking[],
  enabled: boolean,
  markersByIdRef: React.RefObject<Map<string, mapboxgl.Marker>>,
  selectedId: string | null,
  onSelect: (id: string) => void,
) {
  const syncAll = useCallback(async () => {
    const map = mapRef.current;
    if (!map?.loaded?.()) return;

    if (!enabled || trackings.length === 0) {
      clearTrackingRouteLayers(map);
      if (markersByIdRef.current) {
        clearTrackingVehicleMarkers(markersByIdRef.current);
      }
      return;
    }

    syncTrackingRouteLayers(map, trackings);

    const mapboxgl = await loadMapboxGl();
    if (!markersByIdRef.current) return;
    syncTrackingVehicleMarkers(
      map,
      mapboxgl,
      trackings,
      markersByIdRef.current,
      selectedId,
      onSelect,
    );
  }, [mapRef, trackings, enabled, markersByIdRef, selectedId, onSelect]);

  useEffect(() => {
    void syncAll();
  }, [syncAll]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onReady = () => {
      void syncAll();
    };

    if (map.loaded?.()) {
      onReady();
    } else {
      map.once("load", onReady);
    }

    return () => {
      map.off("load", onReady);
    };
  }, [mapRef, syncAll]);

  useEffect(() => {
    return () => {
      if (markersByIdRef.current) {
        clearTrackingVehicleMarkers(markersByIdRef.current);
      }
      const map = mapRef.current;
      if (map?.loaded?.()) {
        clearTrackingRouteLayers(map);
      }
    };
  }, [mapRef, markersByIdRef]);
}
