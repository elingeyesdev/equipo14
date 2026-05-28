// En dev, el proxy de Vite evita CORS: /api → túnel o backend local
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:3000/api')

function getToken() {
  return localStorage.getItem('admin_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const isFormData = options.body instanceof FormData
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    let err
    try {
      err = await res.json()
    } catch {
      err = { message: res.statusText }
    }

    let msg
    if (err && typeof err === 'object') {
      if (Array.isArray(err.message)) {
        msg = err.message.join(', ')
      } else if (typeof err.message === 'string') {
        msg = err.message
      } else if (err.message && typeof err.message === 'object') {
        msg = JSON.stringify(err.message)
      } else if (typeof err.error === 'string') {
        msg = err.error
      } else {
        msg = JSON.stringify(err)
      }
    } else {
      msg = String(err)
    }

    throw new Error(msg || `Error ${res.status}`)
  }

  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body, options = {}) =>
    request(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: options.headers,
    }),
  patch: (path, body, options = {}) =>
    request(path, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: options.headers,
    }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
