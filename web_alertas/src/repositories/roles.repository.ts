import { httpClient } from "../api/httpClient";
import { type Role } from "../domain/types";

export const rolesRepository = {
  findAll: async (): Promise<Role[]> => {
    return httpClient.get<Role[]>("/roles");
  },

  create: async (name: string): Promise<Role> => {
    return httpClient.post<Role>("/roles", { name });
  },

  remove: async (id: number): Promise<{ message: string }> => {
    return httpClient.delete<{ message: string }>(`/roles/${id}`);
  }
};
