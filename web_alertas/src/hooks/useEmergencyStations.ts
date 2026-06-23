import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  emergencyStationRepository,
  type CreateEmergencyStationPayload,
} from "../repositories/emergency-station.repository";
import { type EmergencyStation } from "../domain/types";

export function useEmergencyStations(options: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();

  const stationsQuery = useQuery<EmergencyStation[], Error>({
    queryKey: ["emergency-stations"],
    queryFn: () => emergencyStationRepository.findAll(),
    enabled: options.enabled !== false,
  });

  const createStationMutation = useMutation<EmergencyStation, Error, CreateEmergencyStationPayload>({
    mutationFn: (payload) => emergencyStationRepository.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-stations"] });
    },
  });

  const updateStationMutation = useMutation<EmergencyStation, Error, { id: number; name: string }>({
    mutationFn: ({ id, name }) => emergencyStationRepository.update(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-stations"] });
    },
  });

  const deleteStationMutation = useMutation<{ message: string }, Error, number>({
    mutationFn: (id) => emergencyStationRepository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-stations"] });
    },
  });

  return {
    stations: stationsQuery.data || [],
    emergencyStations: stationsQuery.data || [],
    isLoading: stationsQuery.isLoading,
    isError: stationsQuery.isError,
    error: stationsQuery.error,
    refetch: stationsQuery.refetch,

    createStation: createStationMutation.mutateAsync,
    isCreating: createStationMutation.isPending,

    updateStation: updateStationMutation.mutateAsync,
    isUpdating: updateStationMutation.isPending,

    deleteStation: deleteStationMutation.mutateAsync,
    isDeleting: deleteStationMutation.isPending,
  };
}
