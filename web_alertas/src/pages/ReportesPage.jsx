import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useReports } from '../hooks/useReports'
import PageContainer from '../components/ui/PageContainer'
import { computeZoneRegions } from '../utils/zones'
import { Download, FileSpreadsheet, FileText, ArrowLeft } from 'lucide-react'
import jsPDF from 'jspdf'

export default function ReportesPage() {
  const { reports, loading, error } = useReports()
  const [statusFilter, setStatusFilter] = useState('all')
  const [zoneFilter, setZoneFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const zones = useMemo(() => {
    const set = new Set(reports.map((r) => r.zone?.trim() || 'Sin zona'))
    return ['all', ...Array.from(set).sort()]
  }, [reports])

  const types = useMemo(() => {
    const set = new Set(reports.map((r) => r.type?.name).filter(Boolean))
    return ['all', ...Array.from(set).sort()]
  }, [reports])

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter === 'verified' && !r.verified) return false
      if (statusFilter === 'pending' && r.verified) return false
      if (zoneFilter !== 'all' && (r.zone?.trim() || 'Sin zona') !== zoneFilter) return false
      if (typeFilter !== 'all' && r.type?.name !== typeFilter) return false
      return true
    })
  }, [reports, statusFilter, zoneFilter, typeFilter])

  const zoneSummary = useMemo(() => computeZoneRegions(filtered), [filtered])

  const exportCSV = () => {
    const headers = ['ID', 'Tipo', 'Descripción', 'Zona', 'Latitud', 'Longitud', 'Estado', 'Fecha']
    const rows = filtered.map((r) =>
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
    doc.text(`Generado: ${new Date().toLocaleString()} · ${filtered.length} registros`, 14, y)
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
    filtered.forEach((r) => {
      if (y > 275) {
        doc.addPage()
        y = 20
      }
      const line = `#${r.id} | ${r.type?.name || '—'} | ${r.zone || '—'} | ${r.verified ? 'OK' : 'Pend.'} | ${new Date(r.created_at).toLocaleDateString()}`
      doc.text(line, 14, y)
      y += 5
    })
    doc.save(`alertas_reportes_${Date.now()}.pdf`)
  }

  return (
    <div className="app-shell pt-20 pb-12">
      <PageContainer>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] mb-2 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al panel
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink)] tracking-tight">
              Generación de reportes
            </h1>
            <p className="mt-1 text-sm text-[var(--body)]">
              Filtra, visualiza y exporta datos (Sprint 2 · 3.4)
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={exportCSV} className="btn-secondary !h-9 text-[13px]">
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </button>
            <button type="button" onClick={exportPDF} className="btn-secondary !h-9 text-[13px]">
              <FileText className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="admin-card p-4 mb-6 flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--elevated)] text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="verified">Verificados</option>
            <option value="pending">Pendientes</option>
          </select>
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--elevated)] text-sm max-w-[180px]"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z === 'all' ? 'Todas las zonas' : z}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--elevated)] text-sm max-w-[180px]"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'Todos los tipos' : t}
              </option>
            ))}
          </select>
          <span className="ml-auto self-center text-sm text-[var(--muted)]">
            {filtered.length} registros
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 mb-6">
          {zoneSummary.slice(0, 6).map((z) => (
            <div key={z.name} className="admin-card p-4 flex items-center gap-3">
              <span
                className="h-10 w-10 rounded-full shrink-0 opacity-20"
                style={{ background: z.color }}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--ink)] truncate">{z.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {z.count} alertas · {z.verified} verificadas
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table w-full">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Zona</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[var(--muted)]">
                      Cargando…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[var(--muted)]">
                      Sin datos para exportar.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-[var(--surface-hover)]">
                      <td className="px-4 py-3 font-mono text-[var(--muted)]">#{r.id}</td>
                      <td className="px-4 py-3 font-medium text-[var(--ink)]">
                        {r.type?.name || '—'}
                      </td>
                      <td className="px-4 py-3">{r.zone || 'Sin zona'}</td>
                      <td className="px-4 py-3">
                        {r.verified ? (
                          <span className="badge-verified text-xs font-semibold px-2 py-0.5 rounded-full">
                            Verificado
                          </span>
                        ) : (
                          <span className="badge-pending text-xs font-semibold px-2 py-0.5 rounded-full">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--muted)]">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
