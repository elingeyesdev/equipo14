import type { EmergencyStation } from "@/domain/types";

export const STATION_COLORS: Record<string, string> = {
  policia: "#2563eb",
  bombero: "#dc2626",
  hospital: "#16a34a",
};

export const STATION_LABELS: Record<string, string> = {
  policia: "Policía",
  bombero: "Bomberos",
  hospital: "Hospital",
};

export function stationColor(type: string): string {
  return STATION_COLORS[type] ?? "#64748b";
}

export function stationLabel(type: string): string {
  return STATION_LABELS[type] ?? type;
}

export function emergencyStationsToGeoJson(stations: EmergencyStation[]) {
  return {
    type: "FeatureCollection" as const,
    features: stations.map((s) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: s.coordinates,
      },
      properties: {
        id: s.id,
        name: s.name,
        installation_type: s.installation_type,
        color: stationColor(s.installation_type),
        label: stationLabel(s.installation_type),
      },
    })),
  };
}
