import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function ProtectedRoute({ children, authorityOnly = false }) {
  const { isAuthenticated, isAdmin, bootstrapping, loading } = useAuth()
  const location = useLocation()

  if (bootstrapping || loading) {
    return (
      <div className="app-shell min-h-[50vh] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (authorityOnly && !isAdmin) {
    return <Navigate to="/mapa" replace />
  }

  return children
}
