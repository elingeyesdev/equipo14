import { useState } from 'react'
import { CheckCircle, Trash2 } from 'lucide-react'
import { deleteReport, verifyReport } from '../../api/reports'

/** Tabla de incidentes — los filtros globales están en IncidentFilterBar */
export default function AdminIncidents({ reports, loading, error, onRefresh }) {
  const [processing, setProcessing] = useState(null)

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
                <th className="px-4 py-3.5">ID</th>
                <th className="px-4 py-3.5">Tipo</th>
                <th className="px-4 py-3.5">Descripción</th>
                <th className="px-4 py-3.5">Zona</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5">Fecha</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[var(--muted)]">
                    Cargando incidentes…
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[var(--muted)]">
                    No hay incidentes con estos filtros.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-4 py-3.5 font-mono text-[var(--muted)]">#{report.id}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block rounded-md bg-[var(--surface-hover)] px-2 py-0.5 text-xs font-semibold text-[var(--ink)]">
                        {report.type?.name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[220px] truncate" title={report.description}>
                      {report.description}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--body)]">{report.zone || 'Sin zona'}</td>
                    <td className="px-4 py-3.5">
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
                    <td className="px-4 py-3.5 text-xs text-[var(--muted)] whitespace-nowrap">
                      {new Date(report.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
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
          {reports.length} incidentes en vista
        </div>
      </div>
    </div>
  )
}
