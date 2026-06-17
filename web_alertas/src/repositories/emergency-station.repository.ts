import { httpClient } from "../api/httpClient";
import { type EmergencyStation } from "../domain/types";

export const emergencyStationRepository = {
  findAll: (): Promise<EmergencyStation[]> =>
    httpClient.get<EmergencyStation[]>("/emergency-stations"),
};
