const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'https://715h83m3-3000.brs.devtunnels.ms/api')

const USER_KEY = 'alertas_user'

export async function login(phone, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message
    throw new Error(msg || 'Credenciales inválidas')
  }
  const data = await res.json()
  if (data.access_token) {
    localStorage.setItem('admin_token', data.access_token)
    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
  }
  if (data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
  }
  return data
}

export async function fetchMe() {
  const token = localStorage.getItem('admin_token')
  if (!token) return null

  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    if (res.status === 401) {
      logout()
    }
    return null
  }
  const user = await res.json()
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  return user
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem(USER_KEY)
}

export function getStoredToken() {
  return localStorage.getItem('admin_token')
}

export function isAuthenticated() {
  return !!localStorage.getItem('admin_token')
}
