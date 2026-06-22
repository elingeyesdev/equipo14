import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  usersRepository,
  type CreateUserPayload,
} from "../repositories/users.repository";
import { type User } from "../domain/types";

export function useUsers(options: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();

  const usersQuery = useQuery<User[], Error>({
    queryKey: ["users"],
    queryFn: () => usersRepository.findAll(),
    enabled: options.enabled !== false,
  });

  const createUserMutation = useMutation<User, Error, CreateUserPayload>({
    mutationFn: (payload) => usersRepository.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteUserMutation = useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => usersRepository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const sendMailMutation = useMutation<
    { message: string },
    Error,
    { id: string; subject: string; content: string }
  >({
    mutationFn: ({ id, subject, content }) =>
      usersRepository.sendMail(id, subject, content),
  });

  const updateAuthorityProfileMutation = useMutation<
    any,
    Error,
    { userId: string; data: { ci?: string; gmail?: string; profile_type?: string } }
  >({
    mutationFn: ({ userId, data }) =>
      usersRepository.updateAuthorityProfile(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return {
    users: usersQuery.data || [],
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    error: usersQuery.error,
    refetch: usersQuery.refetch,

    createUser: createUserMutation.mutateAsync,
    isCreating: createUserMutation.isPending,

    deleteUser: deleteUserMutation.mutateAsync,
    isDeleting: deleteUserMutation.isPending,

    sendMail: sendMailMutation.mutateAsync,
    isSendingMail: sendMailMutation.isPending,

    updateAuthorityProfile: updateAuthorityProfileMutation.mutateAsync,
    isUpdatingAuthorityProfile: updateAuthorityProfileMutation.isPending,
  };
}
