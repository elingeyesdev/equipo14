import { useQuery } from "@tanstack/react-query";
import { emergencyStationRepository } from "../repositories/emergency-station.repository";
import { type EmergencyStation } from "../domain/types";

export function useEmergencyStations(options: { enabled?: boolean } = {}) {
  const stationsQuery = useQuery<EmergencyStation[], Error>({
    queryKey: ["emergency-stations"],
    queryFn: () => emergencyStationRepository.findAll(),
    enabled: options.enabled !== false,
  });

  return {
    emergencyStations: stationsQuery.data ?? [],
    isLoading: stationsQuery.isLoading,
    refetch: stationsQuery.refetch,
  };
}
