import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesRepository } from "../repositories/roles.repository";
import { type Role } from "../domain/types";

export function useRoles(options: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();

  const rolesQuery = useQuery<Role[], Error>({
    queryKey: ["roles"],
    queryFn: () => rolesRepository.findAll(),
    enabled: options.enabled !== false,
  });

  const createRoleMutation = useMutation<Role, Error, string>({
    mutationFn: (name) => rolesRepository.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const deleteRoleMutation = useMutation<{ message: string }, Error, number>({
    mutationFn: (id) => rolesRepository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  return {
    roles: rolesQuery.data || [],
    isLoading: rolesQuery.isLoading,
    isError: rolesQuery.isError,
    error: rolesQuery.error,

    createRole: createRoleMutation.mutateAsync,
    isCreating: createRoleMutation.isPending,

    deleteRole: deleteRoleMutation.mutateAsync,
    isDeleting: deleteRoleMutation.isPending,
  };
}
