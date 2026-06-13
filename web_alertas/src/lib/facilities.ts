import type { EmergencyFacility } from "@/domain/types";

export const FACILITY_COLORS: Record<string, string> = {
  policia: "#2563eb",
  bombero: "#dc2626",
  hospital: "#16a34a",
  ambulancia: "#ea580c",
};

export const FACILITY_LABELS: Record<string, string> = {
  policia: "Policía",
  bombero: "Bomberos",
  hospital: "Hospital",
  ambulancia: "Ambulancia",
};

export function facilityColor(type: string): string {
  return FACILITY_COLORS[type] ?? "#64748b";
}

export function facilityLabel(type: string): string {
  return FACILITY_LABELS[type] ?? type;
}

export function facilitiesToGeoJson(facilities: EmergencyFacility[]) {
  return {
    type: "FeatureCollection" as const,
    features: facilities.map((f) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [f.longitude, f.latitude],
      },
      properties: {
        id: f.id,
        name: f.name,
        type: f.type,
        address: f.address ?? "",
        color: facilityColor(f.type),
        label: facilityLabel(f.type),
      },
    })),
  };
}
