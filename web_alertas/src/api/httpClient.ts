import { type Session } from "../domain/types";

const API_BASE_URL = "https://srbd68d5-3000.brs.devtunnels.ms/api";

export const getSession = (): Session | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("alertas:session");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setSession = (session: Session) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("alertas:session", JSON.stringify(session));
};

export const clearSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("alertas:session");
};

export const httpClient = {
  request: async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    const session = getSession();
    const headers = new Headers(options.headers || {});

    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }

    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && session?.refresh_token && path !== "/auth/login" && path !== "/auth/refresh") {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        });
        if (refreshResponse.ok) {
          const { access_token } = await refreshResponse.json();
          setSession({
            ...session,
            access_token,
          });
          headers.set("Authorization", `Bearer ${access_token}`);
          const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers,
          });
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }
      } catch (e) {
        console.error("Token refresh failed", e);
      }

      clearSession();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Sesión expirada");
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Ocurrió un error en la solicitud";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    return response.json();
  },

  get: async <T>(path: string, options?: RequestInit): Promise<T> => {
    return httpClient.request<T>(path, { ...options, method: "GET" });
  },

  post: async <T>(path: string, body?: any, options?: RequestInit): Promise<T> => {
    return httpClient.request<T>(path, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  patch: async <T>(path: string, body?: any, options?: RequestInit): Promise<T> => {
    return httpClient.request<T>(path, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  delete: async <T>(path: string, options?: RequestInit): Promise<T> => {
    return httpClient.request<T>(path, { ...options, method: "DELETE" });
  },
};
