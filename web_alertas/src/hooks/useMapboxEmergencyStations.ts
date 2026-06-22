import { useEffect, useRef } from "react";
import type { EmergencyStation } from "@/domain/types";
import { clearEmergencyStationsOnMap, syncEmergencyStationsOnMap } from "@/lib/mapbox-emergency-station";
import { bringReportMarkersToFront } from "@/lib/mapbox-reports";
import { loadMapboxGl } from "@/lib/mapbox";

export function useMapboxEmergencyStations(
  map: any,
  stations: EmergencyStation[],
  enabled: boolean,
  isMapReady: boolean,
) {
  const markersByIdRef = useRef<Map<number, any>>(new Map());

  useEffect(() => {
    if (!map || !isMapReady) return;

    let active = true;

    const sync = async () => {
      if (!enabled || stations.length === 0) {
        clearEmergencyStationsOnMap(markersByIdRef.current);
      } else {
        const mapboxgl = await loadMapboxGl();
        if (!active) return;
        syncEmergencyStationsOnMap(map, mapboxgl, stations, markersByIdRef.current);
      }
      bringReportMarkersToFront(map);
    };

    void sync();

    return () => {
      active = false;
    };
  }, [map, isMapReady, enabled, stations]);

  // Clean up markers when map changes or component unmounts
  useEffect(() => {
    return () => {
      clearEmergencyStationsOnMap(markersByIdRef.current);
    };
  }, [map]);
}
