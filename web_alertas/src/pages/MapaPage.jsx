import { useState } from 'react'
import { Layers } from 'lucide-react'
import PageContainer from '../components/ui/PageContainer'
import MapaInteractivo, { MapZonePanel } from '../components/MapaInteractivo'
import { useReports } from '../hooks/useReports'
import { useAuth } from '../context/AuthContext'

export default function MapaPage() {
  const { user, role, isAdmin } = useAuth()
  const { reports, loading, error, refresh } = useReports()
  const [selectedZone, setSelectedZone] = useState(null)
  const [showZones, setShowZones] = useState(true)

  return (
    <div className="app-shell pt-20 pb-12">
      <PageContainer>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink)] tracking-tight">
              Mapa de incidentes
            </h1>
            <p className="mt-1 text-[var(--body)] text-sm sm:text-base max-w-xl">
              Hola, {user?.first_name || 'usuario'} ({role?.name || 'usuario'}).
              {isAdmin ? ' Tienes acceso de autoridad al panel y reportes.' : ''}
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--body)] cursor-pointer">
            <input
              type="checkbox"
              checked={showZones}
              onChange={(e) => setShowZones(e.target.checked)}
              className="rounded border-[var(--border-strong)]"
            />
            <Layers className="h-4 w-4" />
            Mostrar zonas
          </label>
        </div>

        {error && (
          <div className="alert-banner mb-4 flex flex-wrap items-center justify-between gap-2">
            <span>Error al cargar datos: {error}</span>
            <button type="button" onClick={refresh} className="font-semibold underline">
              Reintentar
            </button>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <aside className="admin-card p-4 order-2 lg:order-1">
            <h2 className="text-sm font-bold text-[var(--ink)] mb-3">Zonas activas</h2>
            {loading ? (
              <p className="text-sm text-[var(--muted)]">Cargando…</p>
            ) : (
              <MapZonePanel
                reports={reports}
                selectedZone={selectedZone}
                onZoneSelect={setSelectedZone}
              />
            )}
          </aside>

          <div className="admin-card overflow-hidden h-[min(70vh,640px)] order-1 lg:order-2">
            <MapaInteractivo
              className="h-full w-full"
              showZones={showZones}
              selectedZone={selectedZone}
              onZoneSelect={setSelectedZone}
              externalReports={reports}
              externalLoading={loading}
            />
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
