import { authRepository } from "../repositories/auth.repository";
import { getSession, setSession, clearSession } from "../api/httpClient";
import { getRememberLogin, persistSession } from "@/lib/auth-session";
import { type Session, type User } from "../domain/types";

export const authService = {
  login: async (
    phone: string,
    password: string,
    options?: { remember?: boolean },
  ): Promise<Session> => {
    const session = await authRepository.login(phone, password);

    const roleName = session.user.role?.name || "";
    const roleId = session.user.role?.id;
    const isAuth = roleId === 2 || roleName.toLowerCase().includes("autoridad");

    if (!isAuth) {
      throw new Error(
        "Acceso denegado: solo las autoridades pueden ingresar al panel administrativo.",
      );
    }

    const remember = options?.remember ?? getRememberLogin();
    persistSession(session, remember);
    return session;
  },

  getCurrentUser: async (): Promise<User> => {
    return authRepository.getMe();
  },

  logout: async (): Promise<{ message: string }> => {
    try {
      return await authRepository.logout();
    } finally {
      clearSession();
    }
  },

  /** Restaura sesión guardada; renueva token si hace falta. null = no hay sesión válida */
  restoreSession: async (): Promise<Session | null> => {
    const current = getSession();
    if (!current?.access_token) return null;

    try {
      const user = await authRepository.getMe();
      const updated: Session = { ...current, user };
      setSession(updated);
      return updated;
    } catch {
      if (!current.refresh_token) {
        clearSession();
        return null;
      }
      try {
        const { access_token } = await authRepository.refresh(current.refresh_token);
        const withToken: Session = { ...current, access_token };
        setSession(withToken);
        const user = await authRepository.getMe();
        const updated: Session = { ...withToken, user };
        setSession(updated);
        return updated;
      } catch {
        clearSession();
        return null;
      }
    }
  },

  validateSession: async (): Promise<Session> => {
    const restored = await authService.restoreSession();
    if (!restored) throw new Error("No hay sesión activa");
    return restored;
  },
};
