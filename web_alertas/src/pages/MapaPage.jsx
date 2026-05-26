import { lazy, Suspense, useState } from 'react'
import { Layers } from 'lucide-react'
import MapZonePanel from '../components/MapZonePanel'

const MapaInteractivo = lazy(() => import('../components/MapaInteractivo'))
import IncidentFilterBar from '../components/filters/IncidentFilterBar'
import DashboardPageShell, { DashboardPageHeader } from '../components/ui/DashboardPageShell'
import { useReportFilters } from '../context/ReportFilterContext'
import { useAuth } from '../context/AuthContext'

export default function MapaPage() {
  const { user, role, isAdmin } = useAuth()
  const { filteredReports, loading, error, refresh } = useReportFilters()
  const [selectedZone, setSelectedZone] = useState(null)
  const [showZones, setShowZones] = useState(true)

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="Mapa de incidentes"
        description={`Hola, ${user?.first_name || 'usuario'} (${role?.name || 'usuario'}).${
          isAdmin ? ' Acceso de autoridad al panel y reportes.' : ''
        }`}
        actions={
          <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--body)] cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={showZones}
              onChange={(e) => setShowZones(e.target.checked)}
              className="rounded border-[var(--border-strong)]"
            />
            <Layers className="h-4 w-4" />
            Mostrar zonas
          </label>
        }
      />

      <div className="dashboard-section">
        <IncidentFilterBar />
      </div>

      {error && (
        <div className="alert-banner mb-4 flex flex-wrap items-center justify-between gap-2">
          <span>Error al cargar datos: {error}</span>
          <button type="button" onClick={refresh} className="font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      <div className="map-layout">
        <aside className="admin-card map-sidebar">
          <h2 className="text-sm font-bold text-[var(--ink)] mb-3">Zonas activas</h2>
          {loading ? (
            <p className="text-sm text-[var(--muted)]">Cargando…</p>
          ) : (
            <MapZonePanel
              reports={filteredReports}
              selectedZone={selectedZone}
              onZoneSelect={setSelectedZone}
            />
          )}
        </aside>

        <div className="admin-card map-canvas-wrap">
          <Suspense
            fallback={
              <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-[var(--muted)]">
                Cargando mapa Mapbox 3D…
              </div>
            }
          >
            <MapaInteractivo
              className="h-full w-full"
              showZones={showZones}
              selectedZone={selectedZone}
              onZoneSelect={setSelectedZone}
              externalReports={filteredReports}
              externalLoading={loading}
            />
          </Suspense>
        </div>
      </div>
    </DashboardPageShell>
  )
}
