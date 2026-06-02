import { httpClient } from "../api/httpClient";
import { type Zone } from "../domain/types";

export const zonesRepository = {
  findAll: (): Promise<Zone[]> => httpClient.get<Zone[]>("/zones"),

  create: (payload: {
    name: string;
    color?: string;
    coordinates: number[][];
  }): Promise<Zone> => httpClient.post<Zone>("/zones", payload),

  remove: (id: number): Promise<{ message: string }> =>
    httpClient.delete<{ message: string }>(`/zones/${id}`),

  lookup: (latitude: number, longitude: number): Promise<{ name: string | null }> =>
    httpClient.get<{ name: string | null }>(
      `/zones/lookup?latitude=${latitude}&longitude=${longitude}`,
    ),
};
