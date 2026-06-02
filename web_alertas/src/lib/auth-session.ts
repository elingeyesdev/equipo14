import { type Session } from "@/domain/types";

const SESSION_KEY = "alertas:session";
const REMEMBER_KEY = "alertas:remember-login";

export function getRememberLogin(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(REMEMBER_KEY);
  if (raw === null) return true;
  return raw === "true";
}

export function setRememberLogin(remember: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
}

export function getStoredSession(): Session | null {
  if (typeof window === "undefined") return null;
  const storage = getRememberLogin() ? localStorage : sessionStorage;
  const raw = storage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function persistSession(session: Session, remember = getRememberLogin()) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(session);
  if (remember) {
    localStorage.setItem(SESSION_KEY, payload);
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    sessionStorage.setItem(SESSION_KEY, payload);
    localStorage.removeItem(SESSION_KEY);
  }
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
