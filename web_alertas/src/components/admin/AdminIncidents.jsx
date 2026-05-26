import { useMemo, useState } from 'react'
import { CheckCircle, Search, Trash2 } from 'lucide-react'
import { deleteReport, verifyReport } from '../../api/reports'

export default function AdminIncidents({ reports, loading, error, onRefresh }) {
  const [processing, setProcessing] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [zoneFilter, setZoneFilter] = useState('all')

  const zones = useMemo(() => {
    const set = new Set(reports.map((r) => r.zone?.trim() || 'Sin zona'))
    return ['all', ...Array.from(set).sort()]
  }, [reports])

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter === 'verified' && !r.verified) return false
      if (statusFilter === 'pending' && r.verified) return false
      if (zoneFilter !== 'all' && (r.zone?.trim() || 'Sin zona') !== zoneFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const hay = [
          String(r.id),
          r.description,
          r.zone,
          r.type?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [reports, search, statusFilter, zoneFilter])

  const handleVerify = async (id) => {
    if (!window.confirm('¿Verificar este reporte?')) return
    setProcessing(id)
    try {
      await verifyReport(id)
      onRefresh()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar permanentemente este reporte?')) return
    setProcessing(id)
    try {
      await deleteReport(id)
      onRefresh()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
          <input
            type="search"
            placeholder="Buscar por ID, descripción, zona…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--border-strong)] bg-[var(--elevated)] text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--elevated)] text-sm text-[var(--ink)]"
        >
          <option value="all">Todos los estados</option>
          <option value="verified">Verificados</option>
          <option value="pending">Pendientes</option>
        </select>
        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--elevated)] text-sm text-[var(--ink)] max-w-[200px]"
        >
          {zones.map((z) => (
            <option key={z} value={z}>
              {z === 'all' ? 'Todas las zonas' : z}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table w-full text-left">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Zona</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[var(--muted)]">
                    Cargando incidentes…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[var(--muted)]">
                    No hay incidentes con estos filtros.
                  </td>
                </tr>
              ) : (
                filtered.map((report) => (
                  <tr key={report.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-4 py-3 font-mono text-[var(--muted)]">#{report.id}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-md bg-[var(--surface-hover)] px-2 py-0.5 text-xs font-semibold text-[var(--ink)]">
                        {report.type?.name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[220px] truncate" title={report.description}>
                      {report.description}
                    </td>
                    <td className="px-4 py-3 text-[var(--body)]">{report.zone || 'Sin zona'}</td>
                    <td className="px-4 py-3">
                      {report.verified ? (
                        <span className="badge-verified inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
                          <CheckCircle className="h-3 w-3" /> Verificado
                        </span>
                      ) : (
                        <span className="badge-pending rounded-full px-2 py-0.5 text-xs font-semibold">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--muted)] whitespace-nowrap">
                      {new Date(report.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        {!report.verified && (
                          <button
                            type="button"
                            onClick={() => handleVerify(report.id)}
                            disabled={processing === report.id}
                            className="p-2 rounded-lg text-[var(--success)] hover:bg-[var(--surface-hover)] disabled:opacity-40"
                            title="Verificar"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(report.id)}
                          disabled={processing === report.id}
                          className="p-2 rounded-lg text-[var(--danger)] hover:bg-[var(--surface-hover)] disabled:opacity-40"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--muted)]">
          {filtered.length} de {reports.length} incidentes
        </div>
      </div>
    </div>
  )
}
