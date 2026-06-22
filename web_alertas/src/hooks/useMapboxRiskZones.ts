import { useEffect, useMemo } from "react";
import type { Report } from "@/domain/types";
import { buildRiskZonesFromReports, type RiskZone } from "@/lib/risk-zones";
import { clearRiskZonesOnMap, syncRiskZonesOnMap } from "@/lib/mapbox-risk-zones";
import { bringReportMarkersToFront } from "@/lib/mapbox-reports";

export function useMapboxRiskZones(
  map: any,
  reports: Report[],
  enabled: boolean,
  isMapReady: boolean,
) {
  const riskZones = useMemo(() => buildRiskZonesFromReports(reports), [reports]);

  useEffect(() => {
    if (!map || !isMapReady) return;

    if (!enabled || riskZones.length === 0) {
      clearRiskZonesOnMap(map);
    } else {
      syncRiskZonesOnMap(map, riskZones);
    }

    bringReportMarkersToFront(map);
  }, [map, isMapReady, enabled, riskZones]);

  return { riskZones };
}

export type { RiskZone };
