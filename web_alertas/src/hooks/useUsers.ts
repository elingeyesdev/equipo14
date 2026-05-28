import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersRepository } from "../repositories/users.repository";
import { type User } from "../domain/types";

export function useUsers(options: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();

  const usersQuery = useQuery<User[], Error>({
    queryKey: ["users"],
    queryFn: () => usersRepository.findAll(),
    enabled: options.enabled !== false,
  });

  const deleteUserMutation = useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => usersRepository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return {
    users: usersQuery.data || [],
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    error: usersQuery.error,

    deleteUser: deleteUserMutation.mutateAsync,
    isDeleting: deleteUserMutation.isPending,
  };
}
