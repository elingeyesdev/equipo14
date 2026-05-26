import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useReports } from '../hooks/useReports'
import PageContainer from '../components/ui/PageContainer'
import AdminIncidents from '../components/admin/AdminIncidents'
import AdminReportTypes from '../components/admin/AdminReportTypes'
import AdminUsers from '../components/admin/AdminUsers'
import { FileText, LogOut, RefreshCw, Shield, Tags, Users } from 'lucide-react'

const TABS = [
  { id: 'incidents', label: 'Incidentes', icon: Shield },
  { id: 'types', label: 'Tipos', icon: Tags },
  { id: 'users', label: 'Usuarios', icon: Users },
]

export default function AdminPage() {
  const { logout, user, role } = useAuth()
  const navigate = useNavigate()
  const { reports, loading, error, refresh } = useReports()
  const [tab, setTab] = useState('incidents')

  const stats = {
    total: reports.length,
    verified: reports.filter((r) => r.verified).length,
    pending: reports.filter((r) => !r.verified).length,
    zones: new Set(reports.map((r) => r.zone).filter(Boolean)).size,
  }

  return (
    <div className="app-shell pt-20 pb-12">
      <PageContainer>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink)] tracking-tight">
              Panel de administración
            </h1>
            <p className="mt-1 text-sm text-[var(--body)]">
              {user?.first_name} · Rol: {role?.name || 'autoridad'} — gestión de incidentes y datos
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/reportes" className="btn-secondary !h-9 text-[13px]">
              <FileText className="h-4 w-4" />
              Exportar reportes
            </Link>
            <button type="button" onClick={refresh} className="btn-secondary !h-9 text-[13px]">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-[13px] font-semibold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Verificados', value: stats.verified },
            { label: 'Pendientes', value: stats.pending },
            { label: 'Zonas', value: stats.zones },
          ].map((s) => (
            <div key={s.label} className="admin-card px-4 py-3">
              <p className="text-2xl font-bold text-[var(--ink)] tabular-nums">{loading ? '—' : s.value}</p>
              <p className="text-xs font-medium text-[var(--muted)]">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] mb-6 w-fit max-w-full overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === id
                  ? 'bg-[var(--elevated)] text-[var(--ink)] shadow-sm'
                  : 'text-[var(--body)] hover:text-[var(--ink)]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'incidents' && (
          <AdminIncidents
            reports={reports}
            loading={loading}
            error={error}
            onRefresh={refresh}
          />
        )}
        {tab === 'types' && <AdminReportTypes />}
        {tab === 'users' && <AdminUsers />}
      </PageContainer>
    </div>
  )
}
