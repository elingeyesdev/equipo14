import { httpClient } from "../api/httpClient";
import { type User } from "../domain/types";

export const usersRepository = {
  findAll: async (): Promise<User[]> => {
    return httpClient.get<User[]>("/users");
  },

  findOne: async (id: string): Promise<User> => {
    return httpClient.get<User>(`/users/${id}`);
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    return httpClient.patch<User>(`/users/${id}`, data);
  },

  updateFcmToken: async (id: string, fcm_token: string): Promise<{ message: string }> => {
    return httpClient.patch<{ message: string }>(`/users/${id}/fcm-token`, { fcm_token });
  },

  updateLocation: async (id: string, latitude: number, longitude: number): Promise<{ message: string }> => {
    return httpClient.patch<{ message: string }>(`/users/${id}/location`, { latitude, longitude });
  },

  remove: async (id: string): Promise<{ message: string }> => {
    return httpClient.delete<{ message: string }>(`/users/${id}`);
  }
};
