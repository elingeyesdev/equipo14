import { httpClient } from "../api/httpClient";
import { type EmergencyStation } from "../domain/types";

export interface CreateEmergencyStationPayload {
  name: string;
  installation_type: string;
  latitude: number;
  longitude: number;
}

export const emergencyStationRepository = {
  findAll: (): Promise<EmergencyStation[]> =>
    httpClient.get<EmergencyStation[]>("/emergency-stations"),

  create: (payload: CreateEmergencyStationPayload): Promise<EmergencyStation> =>
    httpClient.post<EmergencyStation>("/emergency-stations", payload),

  update: (id: number, payload: { name: string }): Promise<EmergencyStation> =>
    httpClient.patch<EmergencyStation>(`/emergency-stations/${id}`, payload),

  remove: (id: number): Promise<{ message: string }> =>
    httpClient.delete<{ message: string }>(`/emergency-stations/${id}`),
};
