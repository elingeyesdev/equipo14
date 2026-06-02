import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zonesRepository } from "../repositories/zones.repository";
import { type Zone } from "../domain/types";

export function useZones(options: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();

  const zonesQuery = useQuery<Zone[], Error>({
    queryKey: ["zones"],
    queryFn: () => zonesRepository.findAll(),
    enabled: options.enabled !== false,
  });

  const createMutation = useMutation<
    Zone,
    Error,
    { name: string; color?: string; coordinates: number[][] }
  >({
    mutationFn: (payload) => zonesRepository.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const deleteMutation = useMutation<{ message: string }, Error, number>({
    mutationFn: (id) => zonesRepository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });

  return {
    zones: zonesQuery.data ?? [],
    isLoading: zonesQuery.isLoading,
    createZone: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteZone: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    refetch: zonesQuery.refetch,
  };
}
