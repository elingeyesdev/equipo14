import { useCallback, useEffect } from "react";
import type { EmergencyFacility } from "@/domain/types";
import { clearFacilitiesOnMap, syncFacilitiesOnMap } from "@/lib/mapbox-facilities";
import { bringReportMarkersToFront } from "@/lib/mapbox-reports";

export function useMapboxFacilities(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  facilities: EmergencyFacility[],
  enabled: boolean,
) {
  const syncAll = useCallback(() => {
    const map = mapRef.current;
    if (!map?.loaded?.()) return;

    if (!enabled || facilities.length === 0) {
      clearFacilitiesOnMap(map);
    } else {
      syncFacilitiesOnMap(map, facilities);
    }

    bringReportMarkersToFront(map);
  }, [mapRef, enabled, facilities]);

  useEffect(() => {
    syncAll();
  }, [syncAll]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onReady = () => syncAll();
    if (map.loaded?.()) {
      onReady();
    } else {
      map.once("load", onReady);
    }

    return () => {
      map.off("load", onReady);
    };
  }, [mapRef, syncAll]);
}
