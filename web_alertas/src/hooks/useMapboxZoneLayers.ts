import { useEffect, useCallback } from "react";
import type { Zone, Report } from "@/domain/types";
import { syncZoneAreasOnMap, clearZoneAreasOnMap, getZoneColorMap } from "@/lib/mapbox-zones";
import { bringReportMarkersToFront } from "@/lib/mapbox-reports";

export function useMapboxZoneLayers(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  savedZones: Zone[],
  visibleDemarcatedIds: Set<number>,
  activeZoneNames: Set<string>,
  allReports: Report[],
) {
  const syncAll = useCallback(() => {
    const map = mapRef.current;
    if (!map?.loaded?.()) return;

    const hasVisible =
      activeZoneNames.size > 0 || visibleDemarcatedIds.size > 0;

    if (!hasVisible) {
      clearZoneAreasOnMap(map);
    } else {
      syncZoneAreasOnMap(map, {
        activeZoneNames,
        allReports,
        colorByZone: getZoneColorMap(allReports),
        savedZones,
        visibleSavedIds: visibleDemarcatedIds,
      });
    }

    bringReportMarkersToFront(map);
  }, [mapRef, savedZones, visibleDemarcatedIds, activeZoneNames, allReports]);

  useEffect(() => {
    syncAll();
  }, [syncAll]);

  return { syncAll };
}
