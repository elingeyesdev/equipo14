import { httpClient } from "../api/httpClient";

export const imagesRepository = {
  remove: async (id: number): Promise<{ message: string }> => {
    return httpClient.delete<{ message: string }>(`/images/${id}`);
  }
};
