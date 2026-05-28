const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:3000/api')

const USER_KEY = 'alertas_user'

function formatAuthError(err, res) {
  if (err?.name === 'TypeError' || String(err?.message || '').includes('Failed to fetch')) {
    return 'No se pudo conectar al servidor. Inicia el backend (npm run start:dev en backend_nest_alertas) y reinicia la web.'
  }
  if (res?.status === 401) return 'Teléfono o contraseña incorrectos'
  if (res?.status === 404) return 'Usuario no encontrado'
  if (res?.status >= 500) return 'Error del servidor. Revisa que PostgreSQL y el backend estén activos.'
  return null
}

export async function login(phone, password) {
  let res
  try {
    res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: String(phone).trim(), password }),
    })
  } catch (err) {
    throw new Error(formatAuthError(err) || err.message, { cause: err })
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message
    throw new Error(formatAuthError(null, res) || msg || 'Credenciales inválidas')
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

  let res
  try {
    res = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  } catch {
    return null
  }

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
