import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportTypesRepository } from "../repositories/reportTypes.repository";
import { type ReportType } from "../domain/types";

export function useReportTypes(options: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();

  const reportTypesQuery = useQuery<ReportType[], Error>({
    queryKey: ["report-types"],
    queryFn: () => reportTypesRepository.findAll(),
    enabled: options.enabled !== false,
  });

  const createTypeMutation = useMutation<ReportType, Error, string>({
    mutationFn: (name) => reportTypesRepository.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-types"] });
    },
  });

  const deleteTypeMutation = useMutation<void, Error, number>({
    mutationFn: (id) => reportTypesRepository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-types"] });
    },
  });

  return {
    reportTypes: reportTypesQuery.data || [],
    isLoading: reportTypesQuery.isLoading,
    isError: reportTypesQuery.isError,
    error: reportTypesQuery.error,

    createReportType: createTypeMutation.mutateAsync,
    isCreating: createTypeMutation.isPending,

    deleteReportType: deleteTypeMutation.mutateAsync,
    isDeleting: deleteTypeMutation.isPending,
  };
}
