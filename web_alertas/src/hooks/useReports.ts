import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsRepository } from "../repositories/reports.repository";
import { type Report } from "../domain/types";

export function useReports(filters: any = {}, options: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();

  const reportsQuery = useQuery<Report[], Error>({
    queryKey: ["reports", filters],
    queryFn: () => reportsRepository.findAll(filters),
    enabled: options.enabled !== false,
  });

  const verifyMutation = useMutation<Report, Error, number>({
    mutationFn: (id) => reportsRepository.verify(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const deleteMutation = useMutation<{ message: string }, Error, number>({
    mutationFn: (id) => reportsRepository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const createMutation = useMutation<Report, Error, FormData>({
    mutationFn: (formData) => reportsRepository.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  return {
    reports: reportsQuery.data || [],
    isLoading: reportsQuery.isLoading,
    isError: reportsQuery.isError,
    error: reportsQuery.error,
    refetch: reportsQuery.refetch,

    verifyReport: verifyMutation.mutateAsync,
    isVerifying: verifyMutation.isPending,

    deleteReport: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    createReport: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
