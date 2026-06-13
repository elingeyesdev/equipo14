import { httpClient } from "../api/httpClient";
import { type EmergencyFacility } from "../domain/types";

export const facilitiesRepository = {
  findAll: (): Promise<EmergencyFacility[]> =>
    httpClient.get<EmergencyFacility[]>("/facilities"),

  findNearby: (params: {
    latitude: number;
    longitude: number;
    profileType?: string;
    types?: string;
    limit?: number;
  }): Promise<EmergencyFacility[]> => {
    const qs = new URLSearchParams({
      latitude: String(params.latitude),
      longitude: String(params.longitude),
    });
    if (params.profileType) qs.set("profileType", params.profileType);
    if (params.types) qs.set("types", params.types);
    if (params.limit != null) qs.set("limit", String(params.limit));
    return httpClient.get<EmergencyFacility[]>(`/facilities/nearby?${qs}`);
  },
};
