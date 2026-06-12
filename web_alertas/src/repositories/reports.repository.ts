import { httpClient } from "../api/httpClient";
import { type Report } from "../domain/types";

export const reportsRepository = {
  findAll: async (filters: {
    typeId?: string;
    category?: string;
    status?: string;
    zone?: string;
    zoneId?: string;
    search?: string;
    from?: string;
    to?: string;
    includeDeleted?: boolean;
  } = {}): Promise<Report[]> => {
    const params = new URLSearchParams();
    if (filters.typeId) params.append("typeId", filters.typeId);
    if (filters.category && filters.category !== "Todos") {
      const catMap: Record<string, string> = {
        "Accidente": "accidentes",
        "Robo": "robos",
        "Incendio": "incendios",
        "Emergencia": "emergencias"
      };
      const backendCat = catMap[filters.category];
      if (backendCat) params.append("category", backendCat);
    }
    if (filters.status && filters.status !== "Todos") {
      const statusMap: Record<string, string> = {
        "Verificado": "verified",
        "Pendiente": "pending"
      };
      const backendStatus = statusMap[filters.status];
      if (backendStatus) params.append("status", backendStatus);
    }
    if (filters.zoneId) {
      params.append("zoneId", filters.zoneId);
    } else if (filters.zone && filters.zone !== "Todas") {
      params.append("zone", filters.zone);
    }
    if (filters.search) params.append("search", filters.search);
    if (filters.from) params.append("from", filters.from);
    if (filters.to) params.append("to", filters.to);
    if (filters.includeDeleted) params.append("includeDeleted", "true");

    const queryString = params.toString();
    return httpClient.get<Report[]>(`/reports${queryString ? `?${queryString}` : ""}`);
  },

  findOne: async (id: number): Promise<Report> => {
    return httpClient.get<Report>(`/reports/${id}`);
  },

  verify: async (id: number): Promise<Report> => {
    return httpClient.patch<Report>(`/reports/${id}/verify`);
  },

  remove: async (id: number): Promise<{ message: string }> => {
    return httpClient.delete<{ message: string }>(`/reports/${id}`);
  },

  create: async (formData: FormData): Promise<Report> => {
    return httpClient.post<Report>("/reports", formData);
  },

  uploadImage: async (reportId: number, userId: string, formData: FormData): Promise<Report> => {
    return httpClient.post<Report>(`/reports/${reportId}/images/${userId}`, formData);
  },

  findNearby: async (latitude: number, longitude: number, radius: number): Promise<Report[]> => {
    return httpClient.get<Report[]>(`/reports/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
  },

  findCoincidences: async (latitude: number, longitude: number, typeId: number): Promise<any[]> => {
    return httpClient.get<any[]>(`/reports/similars?latitude=${latitude}&longitude=${longitude}&type=${typeId}`);
  },

  findByUser: async (userId: string): Promise<Report[]> => {
    return httpClient.get<Report[]>(`/reports/user/${userId}`);
  }
};
