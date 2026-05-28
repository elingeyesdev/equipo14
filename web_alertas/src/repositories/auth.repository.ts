import { httpClient } from "../api/httpClient";
import { type Session, type User } from "../domain/types";

export const authRepository = {
  login: async (phone: string, password: string): Promise<Session> => {
    return httpClient.post<Session>("/auth/login", { phone, password });
  },

  getMe: async (): Promise<User> => {
    return httpClient.get<User>("/auth/me");
  },

  logout: async (): Promise<{ message: string }> => {
    return httpClient.post<{ message: string }>("/auth/logout");
  },

  refresh: async (refreshToken: string): Promise<{ access_token: string }> => {
    return httpClient.post<{ access_token: string }>("/auth/refresh", { refresh_token: refreshToken });
  }
};
