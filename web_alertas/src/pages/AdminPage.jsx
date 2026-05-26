import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useReportFilters } from '../context/ReportFilterContext'
import DashboardPageShell, { DashboardPageHeader } from '../components/ui/DashboardPageShell'
import IncidentFilterBar from '../components/filters/IncidentFilterBar'
import AdminIncidents from '../components/admin/AdminIncidents'
import AdminReportTypes from '../components/admin/AdminReportTypes'
import AdminUsers from '../components/admin/AdminUsers'
import { useStats } from '../hooks/useStats'
import { FileText, LogOut, RefreshCw, Shield, Tags, Users } from 'lucide-react'

const TABS = [
  { id: 'incidents', label: 'Incidentes', icon: Shield },
  { id: 'types', label: 'Tipos', icon: Tags },
  { id: 'users', label: 'Usuarios', icon: Users },
]

export default function AdminPage() {
  const { logout, user, role } = useAuth()
  const navigate = useNavigate()
  const { filteredReports, loading, error, refresh } = useReportFilters()
  const { total, verified, zones } = useStats(filteredReports)
  const [tab, setTab] = useState('incidents')

  const pending = total - verified

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="Panel de administración"
        description={`${user?.first_name} · Rol: ${role?.name || 'autoridad'} — gestión de incidentes y datos`}
        actions={
          <>
            <Link to="/reportes" className="btn-secondary !h-9 text-[13px]">
              <FileText className="h-4 w-4" />
              Exportar
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
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-[13px] font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </>
        }
      />

      {tab === 'incidents' && (
        <div className="dashboard-section">
          <IncidentFilterBar />
        </div>
      )}

      <div className="admin-stat-grid">
        <div className="admin-stat-box">
          <strong>{loading ? '—' : total}</strong>
          <span>Total (filtro)</span>
        </div>
        <div className="admin-stat-box">
          <strong>{loading ? '—' : verified}</strong>
          <span>Verificados</span>
        </div>
        <div className="admin-stat-box">
          <strong>{loading ? '—' : pending}</strong>
          <span>Pendientes</span>
        </div>
        <div className="admin-stat-box">
          <strong>{loading ? '—' : zones}</strong>
          <span>Zonas</span>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] mb-6 w-full max-w-full overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
              tab === id
                ? 'bg-[var(--elevated)] text-[var(--ink)] shadow-sm'
                : 'text-[var(--body)] hover:text-[var(--ink)]'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'incidents' && (
        <AdminIncidents
          reports={filteredReports}
          loading={loading}
          error={error}
          onRefresh={refresh}
        />
      )}
      {tab === 'types' && <AdminReportTypes />}
      {tab === 'users' && <AdminUsers />}
    </DashboardPageShell>
  )
}
