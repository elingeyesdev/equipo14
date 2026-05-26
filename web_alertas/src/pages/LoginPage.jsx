import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Navigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import PageContainer from '../components/ui/PageContainer'
import InputWithIcon from '../components/ui/InputWithIcon'
import PasswordInput from '../components/ui/PasswordInput'
import { Shield, Phone, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [apiOnline, setApiOnline] = useState(null)
  const { login, loading, error, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/mapa'

  useEffect(() => {
    const base = import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api'
    fetch(`${base}/report-types`)
      .then((r) => setApiOnline(r.ok))
      .catch(() => setApiOnline(false))
  }, [])

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await login(phone, password)
    if (success) navigate(from, { replace: true })
  }

  return (
    <div className="login-page login-premium-bg relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full opacity-[0.06] animate-morph pointer-events-none"
        style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
        aria-hidden
      />
      <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] rounded-full opacity-[0.04] animate-morph pointer-events-none"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', animationDelay: '4s' }}
        aria-hidden
      />

      <PageContainer className="max-w-[440px] w-full relative z-10">
        <motion.div
          className="admin-card login-card glass-card"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="login-card-icon"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
          >
            <Shield className="h-8 w-8 text-[var(--btn-primary-fg)]" strokeWidth={2} />
          </motion.div>

          <h1 className="login-card-title">Bienvenido a Alertas</h1>
          <p className="login-card-subtitle">
            Accede con tu cuenta al mapa en vivo y herramientas según tu rol.
          </p>

          {apiOnline === false && (
            <motion.div
              className="login-alert login-alert--warn"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              El backend no responde. Ejecuta <code>npm run start:dev</code> en{' '}
              <code>backend_nest_alertas</code> y reinicia la web.
            </motion.div>
          )}

          {apiOnline === true && (
            <motion.p
              className="login-alert login-alert--ok"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="login-status-dot" />
              Servidor conectado
            </motion.p>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <InputWithIcon
              id="phone"
              label="Teléfono"
              icon={Phone}
              type="tel"
              inputMode="numeric"
              maxLength={8}
              required
              autoComplete="tel"
              placeholder="98765432"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
            />

            <PasswordInput
              id="password"
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {error && (
              <motion.div
                className="auth-error"
                role="alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <button type="submit" disabled={loading} className="w-full btn-primary !h-11">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Verificando…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Entrar al sistema
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          <p className="login-footnote">Teléfono de 8 dígitos · misma cuenta que la app móvil</p>

          <Link to="/" className="login-back">
            ← Volver al inicio
          </Link>
        </motion.div>
      </PageContainer>
    </div>
  )
}
