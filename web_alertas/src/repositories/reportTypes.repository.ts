import { httpClient } from "../api/httpClient";
import { type ReportType } from "../domain/types";

export const reportTypesRepository = {
  findAll: async (): Promise<ReportType[]> => {
    return httpClient.get<ReportType[]>("/report-types");
  },

  create: async (name: string): Promise<ReportType> => {
    return httpClient.post<ReportType>("/report-types", { name });
  },

  remove: async (id: number): Promise<void> => {
    return httpClient.delete<void>(`/report-types/${id}`);
  }
};
