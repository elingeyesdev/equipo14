import { useCallback, useEffect, useMemo } from "react";
import type { Report } from "@/domain/types";
import { buildRiskZonesFromReports, type RiskZone } from "@/lib/risk-zones";
import { clearRiskZonesOnMap, syncRiskZonesOnMap } from "@/lib/mapbox-risk-zones";
import { bringReportMarkersToFront } from "@/lib/mapbox-reports";

export function useMapboxRiskZones(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  reports: Report[],
  enabled: boolean,
) {
  const riskZones = useMemo(() => buildRiskZonesFromReports(reports), [reports]);

  const syncAll = useCallback(() => {
    const map = mapRef.current;
    if (!map?.loaded?.()) return;

    if (!enabled || riskZones.length === 0) {
      clearRiskZonesOnMap(map);
    } else {
      syncRiskZonesOnMap(map, riskZones);
    }

    bringReportMarkersToFront(map);
  }, [mapRef, enabled, riskZones]);

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

  return { riskZones, syncAll };
}

export type { RiskZone };
