import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import { type Session } from "../domain/types";

export function useAuth() {
  const loginMutation = useMutation<Session, Error, { phone: string; password: string }>({
    mutationFn: ({ phone, password }) => authService.login(phone, password),
  });

  const logoutMutation = useMutation<{ message: string }, Error, void>({
    mutationFn: () => authService.logout(),
  });

  return {
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}
