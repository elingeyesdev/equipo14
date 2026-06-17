import { useCallback, useEffect } from "react";
import type { EmergencyStation } from "@/domain/types";
import { clearEmergencyStationsOnMap, syncEmergencyStationsOnMap } from "@/lib/mapbox-emergency-station";
import { bringReportMarkersToFront } from "@/lib/mapbox-reports";

export function useMapboxEmergencyStations(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  stations: EmergencyStation[],
  enabled: boolean,
) {
  const syncAll = useCallback(() => {
    const map = mapRef.current;
    if (!map?.loaded?.()) return;

    if (!enabled || stations.length === 0) {
      clearEmergencyStationsOnMap(map);
    } else {
      syncEmergencyStationsOnMap(map, stations);
    }

    bringReportMarkersToFront(map);
  }, [mapRef, enabled, stations]);

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
