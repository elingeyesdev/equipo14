import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageContainer from '../components/ui/PageContainer'
import { Shield } from 'lucide-react'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/mapa'

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await login(phone, password)
    if (success) navigate(from, { replace: true })
  }

  return (
    <div className="app-shell pt-28 pb-20 flex items-center justify-center min-h-screen">
      <PageContainer className="max-w-md w-full">
        <div className="admin-card p-8">
          <div className="flex justify-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--btn-primary-bg)]">
              <Shield className="h-8 w-8 text-[var(--btn-primary-fg)]" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-[var(--ink)] mb-2">
            Iniciar sesión
          </h1>
          <p className="text-center text-[var(--body)] mb-8 text-sm">
            Accede al mapa en vivo y herramientas según tu rol (ciudadano o autoridad).
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-1">Teléfono</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--elevated)] text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                placeholder="Ej. +591..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-1">Contraseña</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--elevated)] text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg border border-[var(--danger)]/30 bg-red-500/10 text-sm text-[var(--danger)]">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full btn-primary py-3">
              {loading ? (
                <span className="inline-block h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                'Entrar al mapa'
              )}
            </button>
          </form>
        </div>
      </PageContainer>
    </div>
  )
}
