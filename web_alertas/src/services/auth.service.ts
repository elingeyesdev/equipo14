import { authRepository } from "../repositories/auth.repository";
import { setSession, clearSession, getSession } from "../api/httpClient";
import { type Session, type User } from "../domain/types";

export const authService = {
  login: async (phone: string, password: string): Promise<Session> => {
    const session = await authRepository.login(phone, password);
    
    // Core Business Rule Validation: Only authorities allowed in web admin
    const roleName = session.user.role?.name || "";
    const roleId = session.user.role?.id;
    const isAuth = roleId === 2 || roleName.toLowerCase().includes("autoridad");
    
    if (!isAuth) {
      throw new Error("Acceso denegado: solo las autoridades pueden ingresar al panel administrativo.");
    }
    
    setSession(session);
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

  validateSession: async (): Promise<Session> => {
    const current = getSession();
    if (!current) throw new Error("No hay sesión activa");
    
    // Verify token validity in background
    const user = await authRepository.getMe();
    const updated: Session = { ...current, user };
    setSession(updated);
    return updated;
  }
};
