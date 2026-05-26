import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import MapZonePanel from '../components/MapZonePanel'
import MapRadiusControls from '../components/map/MapRadiusControls'
import IncidentFilterBar from '../components/filters/IncidentFilterBar'
import DashboardPageShell, { DashboardPageHeader } from '../components/ui/DashboardPageShell'
import { useReportFilters } from '../context/ReportFilterContext'
import { useAuth } from '../context/AuthContext'
import {
  clampRadiusKm,
  filterReportsByRadius,
  RADIUS_KM_DEFAULT,
  radiusKmToMeters,
} from '../utils/geo'

const MapaInteractivo = lazy(() => import('../components/MapaInteractivo'))

const DEFAULT_CENTER = { latitude: -17.7833, longitude: -63.1821 }

export default function MapaPage() {
  const { user, role, isAdmin } = useAuth()
  const { filteredReports, loading, error, refresh } = useReportFilters()
  const [selectedZone, setSelectedZone] = useState(null)
  const [showZones, setShowZones] = useState(true)

  const [radiusMode, setRadiusMode] = useState(false)
  const [radiusKm, setRadiusKm] = useState(RADIUS_KM_DEFAULT)
  const [radiusPanelOpen, setRadiusPanelOpen] = useState(false)

  const [referencePoint, setReferencePoint] = useState(DEFAULT_CENTER)
  const [hasCustomReference, setHasCustomReference] = useState(false)
  const [isPlacingReference, setIsPlacingReference] = useState(false)
  const [pendingPlacement, setPendingPlacement] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (hasCustomReference) return
        setReferencePoint({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }, [hasCustomReference])

  const mapReports = useMemo(() => {
    if (!radiusMode) return filteredReports
    return filterReportsByRadius(
      filteredReports,
      referencePoint,
      radiusKmToMeters(radiusKm),
    )
  }, [filteredReports, radiusMode, referencePoint, radiusKm])

  const activeCenter = isPlacingReference && pendingPlacement ? pendingPlacement : referencePoint

  const referenceLabel = useMemo(() => {
    if (!radiusMode) return 'Por defecto se muestran todos los reportes de la ciudad.'
    if (isPlacingReference) return 'Selecciona un punto en el mapa y pulsa Confirmar.'
    if (hasCustomReference) {
      return `Referencia personalizada: ${referencePoint.latitude.toFixed(4)}, ${referencePoint.longitude.toFixed(4)}`
    }
    return 'Usando tu ubicación o el centro del mapa como referencia.'
  }, [radiusMode, isPlacingReference, hasCustomReference, referencePoint])

  const handlePlacementClick = useCallback((lat, lng) => {
    if (!isPlacingReference) return
    setPendingPlacement({ latitude: lat, longitude: lng })
  }, [isPlacingReference])

  const handleConfirmReference = useCallback(() => {
    if (pendingPlacement) {
      setReferencePoint(pendingPlacement)
      setHasCustomReference(true)
    }
    setIsPlacingReference(false)
    setPendingPlacement(null)
  }, [pendingPlacement])

  const handleResetReference = useCallback(() => {
    setHasCustomReference(false)
    setIsPlacingReference(false)
    setPendingPlacement(null)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setReferencePoint({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          })
        },
        () => setReferencePoint(DEFAULT_CENTER),
      )
    } else {
      setReferencePoint(DEFAULT_CENTER)
    }
  }, [])

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setReferencePoint({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
        setHasCustomReference(false)
        setPendingPlacement(null)
        setIsPlacingReference(false)
      },
      () => {},
    )
  }, [])

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="Mapa de incidentes"
        description={`Hola, ${user?.first_name || 'usuario'} (${role?.name || 'usuario'}).${
          isAdmin ? ' Acceso de autoridad al panel y reportes.' : ''
        } Por defecto ves todos los reportes; puedes activar el filtro por radio.`}
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
          <h2 className="text-sm font-bold text-[var(--ink)] mb-1">Zonas activas</h2>
          {radiusMode && (
            <p className="text-[10px] text-[var(--muted)] mb-2">
              {mapReports.length} de {filteredReports.length} dentro del radio
            </p>
          )}
          {loading ? (
            <p className="text-sm text-[var(--muted)]">Cargando…</p>
          ) : (
            <MapZonePanel
              reports={mapReports}
              selectedZone={selectedZone}
              onZoneSelect={setSelectedZone}
            />
          )}
        </aside>

        <div className="admin-card map-canvas-wrap relative">
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
              externalReports={mapReports}
              externalLoading={loading}
              searchCenter={radiusMode ? activeCenter : null}
              searchRadiusMeters={radiusMode ? radiusKmToMeters(radiusKm) : null}
              placementMode={isPlacingReference}
              onPlacementClick={handlePlacementClick}
              showReferenceMarker={radiusMode}
            />
          </Suspense>

          <MapRadiusControls
            radiusMode={radiusMode}
            onRadiusModeChange={setRadiusMode}
            radiusKm={radiusKm}
            onRadiusKmChange={(v) => setRadiusKm(clampRadiusKm(v))}
            reportCount={mapReports.length}
            referenceLabel={referenceLabel}
            isPlacingReference={isPlacingReference}
            onStartPlacingReference={() => {
              setPendingPlacement(referencePoint)
              setIsPlacingReference(true)
            }}
            onCancelPlacing={() => {
              setIsPlacingReference(false)
              setPendingPlacement(null)
            }}
            onConfirmReference={handleConfirmReference}
            onResetReference={handleResetReference}
            onUseMyLocation={handleUseMyLocation}
            hasCustomReference={hasCustomReference}
            panelOpen={radiusPanelOpen}
            onPanelOpenChange={setRadiusPanelOpen}
          />
        </div>
      </div>
    </DashboardPageShell>
  )
}
