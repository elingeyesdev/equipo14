import { useQuery } from "@tanstack/react-query";
import { facilitiesRepository } from "../repositories/facilities.repository";
import { type EmergencyFacility } from "../domain/types";

export function useFacilities(options: { enabled?: boolean } = {}) {
  const facilitiesQuery = useQuery<EmergencyFacility[], Error>({
    queryKey: ["facilities"],
    queryFn: () => facilitiesRepository.findAll(),
    enabled: options.enabled !== false,
  });

  return {
    facilities: facilitiesQuery.data ?? [],
    isLoading: facilitiesQuery.isLoading,
    refetch: facilitiesQuery.refetch,
  };
}
