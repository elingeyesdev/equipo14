import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useReportFilters } from '../context/ReportFilterContext'
import DashboardPageShell, { DashboardPageHeader } from '../components/ui/DashboardPageShell'
import IncidentFilterBar from '../components/filters/IncidentFilterBar'
import { computeZoneRegions } from '../utils/zones'
import { FileSpreadsheet, FileText } from 'lucide-react'
import jsPDF from 'jspdf'

export default function ReportesPage() {
  const { filteredReports, reports, loading, error } = useReportFilters()

  const zoneSummary = useMemo(() => computeZoneRegions(filteredReports), [filteredReports])

  const exportCSV = () => {
    const headers = ['ID', 'Tipo', 'Descripción', 'Zona', 'Latitud', 'Longitud', 'Estado', 'Fecha']
    const rows = filteredReports.map((r) =>
      [
        r.id,
        `"${(r.type?.name || '').replace(/"/g, '""')}"`,
        `"${(r.description || '').replace(/"/g, '""')}"`,
        `"${(r.zone || '').replace(/"/g, '""')}"`,
        r.coordinates?.[1] ?? '',
        r.coordinates?.[0] ?? '',
        r.verified ? 'Verificado' : 'Pendiente',
        new Date(r.created_at).toISOString(),
      ].join(',')
    )
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `alertas_reportes_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    let y = 18
    doc.setFontSize(16)
    doc.text('Reporte de incidentes — Alertas', 14, y)
    y += 8
    doc.setFontSize(10)
    doc.text(`Generado: ${new Date().toLocaleString()} · ${filteredReports.length} registros`, 14, y)
    y += 10
    doc.setFontSize(11)
    doc.text('Resumen por zona', 14, y)
    y += 6
    doc.setFontSize(9)
    zoneSummary.forEach((z) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      doc.text(`• ${z.name}: ${z.count} alertas (${z.verified} verificadas)`, 16, y)
      y += 5
    })
    y += 6
    doc.setFontSize(11)
    doc.text('Detalle', 14, y)
    y += 7
    doc.setFontSize(8)
    filteredReports.forEach((r) => {
      if (y > 275) {
        doc.addPage()
        y = 20
      }
      doc.text(
        `#${r.id} | ${r.type?.name || '—'} | ${r.zone || '—'} | ${r.verified ? 'OK' : 'Pend.'}`,
        14,
        y
      )
      y += 5
    })
    doc.save(`alertas_reportes_${Date.now()}.pdf`)
  }

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="Generación de reportes"
        description="Filtra, visualiza y exporta datos administrativos"
        actions={
          <>
            <button type="button" onClick={exportCSV} className="btn-secondary !h-9 text-[13px]">
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </button>
            <button type="button" onClick={exportPDF} className="btn-secondary !h-9 text-[13px]">
              <FileText className="h-4 w-4" />
              PDF
            </button>
          </>
        }
      />

      <p className="mb-4 -mt-2">
        <Link
          to="/admin"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Volver al panel
        </Link>
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="dashboard-section">
        <IncidentFilterBar />
      </div>

      <div className="zone-summary-grid">
        {zoneSummary.slice(0, 6).map((z) => (
          <div key={z.name} className="admin-card p-4 flex items-center gap-3 min-h-[5rem]">
            <span
              className="h-11 w-11 rounded-full shrink-0"
              style={{ background: z.color, opacity: 0.35 }}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--ink)] truncate">{z.name}</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {z.count} alertas · {z.verified} verificadas
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table w-full min-w-[640px]">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
              <tr>
                <th className="px-4 py-3.5 text-left">ID</th>
                <th className="px-4 py-3.5 text-left">Tipo</th>
                <th className="px-4 py-3.5 text-left">Zona</th>
                <th className="px-4 py-3.5 text-left">Estado</th>
                <th className="px-4 py-3.5 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[var(--muted)]">
                    Cargando…
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[var(--muted)]">
                    Sin datos para exportar.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--surface-hover)]">
                    <td className="px-4 py-3.5 font-mono text-[var(--muted)]">#{r.id}</td>
                    <td className="px-4 py-3.5 font-medium text-[var(--ink)]">
                      {r.type?.name || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--body)]">{r.zone || 'Sin zona'}</td>
                    <td className="px-4 py-3.5">
                      {r.verified ? (
                        <span className="badge-verified text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          Verificado
                        </span>
                      ) : (
                        <span className="badge-pending text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[var(--muted)] whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--muted)]">
          {filteredReports.length} de {reports.length} en base · exportación según filtros activos
        </div>
      </div>
    </DashboardPageShell>
  )
}
