import { type Report } from "../domain/types";

export interface KPIs {
  total: number;
  todayCount: number;
  verifiedCount: number;
  pendingCount: number;
  verifiedPercentage: number;
  uniqueZonesCount: number;
}

export interface ActivityDistribution {
  label: string;
  count: number;
}

export const reportsService = {
  // Translate GPS coordinates to map percentages
  getMapPosition: (coordinates: number[]) => {
    const [lng, lat] = coordinates || [0, 0];
    const minLng = -63.25;
    const maxLng = -63.10;
    const minLat = -17.85;
    const maxLat = -17.70;

    let pctX = ((lng - minLng) / (maxLng - minLng)) * 100;
    let pctY = ((maxLat - lat) / (maxLat - minLat)) * 100;

    pctX = Math.max(5, Math.min(95, pctX));
    pctY = Math.max(5, Math.min(95, pctY));

    return { left: `${pctX}%`, top: `${pctY}%` };
  },

  // Calculate high-level KPIs from raw reports list
  calculateKPIs: (reports: Report[]): KPIs => {
    const total = reports.length;
    const verifiedCount = reports.filter((r) => r.verified).length;
    const pendingCount = total - verifiedCount;
    const verifiedPercentage = total > 0 ? Math.round((verifiedCount / total) * 100) : 0;
    
    const todayStr = new Date().toDateString();
    const todayCount = reports.filter((r) => new Date(r.created_at).toDateString() === todayStr).length;

    const uniqueZonesCount = new Set(reports.map((r) => r.zone).filter(Boolean)).size;

    return {
      total,
      todayCount,
      verifiedCount,
      pendingCount,
      verifiedPercentage,
      uniqueZonesCount,
    };
  },

  // Calculate activity distribution grouped by type
  calculateActivityDistribution: (reports: Report[]): ActivityDistribution[] => {
    const typeCounts: Record<string, number> = {};
    reports.forEach((r) => {
      const typeName = r.type?.name || "Otros";
      typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
    });

    return Object.entries(typeCounts)
      .map(([label, count]) => ({
        label,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  },

  // Dynamic file export generation in CSV format
  exportToCSV: (reports: Report[]): string => {
    const headers = ["ID", "Tipo", "Descripcion", "Zona", "Estado", "Peso (pts)", "Fecha Creacion", "Coordenadas"];
    const csvRows = [
      headers.join(","),
      ...reports.map((r) => {
        const id = r.id;
        const type = `"${(r.type?.name || "Desconocido").replace(/"/g, '""')}"`;
        const desc = `"${(r.description || "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
        const zone = `"${(r.zone || "Sin zona").replace(/"/g, '""')}"`;
        const status = r.verified ? "Verificado" : "Pendiente";
        const weight = r.weight || 0;
        const date = new Date(r.created_at).toISOString();
        const coords = `"[${r.coordinates?.join(";")}]"`;
        return [id, type, desc, zone, status, weight, date, coords].join(",");
      }),
    ];

    return "\ufeff" + csvRows.join("\n"); // Add BOM for Excel UTF-8
  }
};
