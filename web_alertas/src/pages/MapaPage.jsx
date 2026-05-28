import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Layers, Plus, X, Upload, MapPin } from 'lucide-react'
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
import { createReport } from '../api/reports'
import { getReportTypes } from '../api/reportTypes'

const MapaInteractivo = lazy(() => import('../components/MapaInteractivo'))

const DEFAULT_CENTER = { latitude: -17.7833, longitude: -63.1821 }

export default function MapaPage() {
  const { user, role, isAdmin } = useAuth()
  const { filteredReports, loading, error, refresh } = useReportFilters()
  const [selectedZone, setSelectedZone] = useState(null)
  const [showZones, setShowZones] = useState(true)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSelectingLocation, setIsSelectingLocation] = useState(false)
  const [reportTypes, setReportTypes] = useState([])
  const [createType, setCreateType] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createLatitude, setCreateLatitude] = useState('')
  const [createLongitude, setCreateLongitude] = useState('')
  const [createZone, setCreateZone] = useState('')
  const [createFile, setCreateFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    getReportTypes()
      .then((data) => setReportTypes(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Error al cargar tipos de reportes:', err))
  }, [])

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
    if (isSelectingLocation) {
      setCreateLatitude(lat.toFixed(6))
      setCreateLongitude(lng.toFixed(6))
      setIsSelectingLocation(false)
      setIsCreateModalOpen(true)
      return
    }
    if (!isPlacingReference) return
    setPendingPlacement({ latitude: lat, longitude: lng })
  }, [isSelectingLocation, isPlacingReference])

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

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!createType) {
      setSubmitError('Por favor selecciona un tipo de incidente.')
      return
    }
    if (!createFile) {
      setSubmitError('Por favor sube una foto del incidente.')
      return
    }
    if (!createDescription.trim()) {
      setSubmitError('Por favor ingresa una descripción.')
      return
    }
    if (!createLatitude || !createLongitude) {
      setSubmitError('Por favor especifica las coordenadas.')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const formData = new FormData()
      formData.append('type', Number(createType))
      formData.append('description', createDescription.trim())
      formData.append('latitude', Number(createLatitude))
      formData.append('longitude', Number(createLongitude))
      formData.append('userId', user.id)
      if (createZone.trim()) {
        formData.append('zone', createZone.trim())
      }
      formData.append('image', createFile)

      await createReport(formData)
      
      // Cerrar modal y limpiar formulario
      setIsCreateModalOpen(false)
      setCreateType('')
      setCreateDescription('')
      setCreateZone('')
      setCreateFile(null)
      setImagePreview('')
      
      // Refrescar mapa
      refresh()
    } catch (err) {
      setSubmitError(err.message || 'Error al reportar el incidente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="Mapa de incidentes"
        description={`Hola, ${user?.first_name || 'usuario'} (${role?.name || 'usuario'}).${
          isAdmin ? ' Acceso de autoridad al panel y reportes.' : ''
        } Por defecto ves todos los reportes; puedes activar el filtro por radio.`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCreateLatitude(referencePoint.latitude.toFixed(6))
                setCreateLongitude(referencePoint.longitude.toFixed(6))
                setCreateType('')
                setCreateDescription('')
                setCreateZone('')
                setCreateFile(null)
                setImagePreview('')
                setSubmitError('')
                setIsCreateModalOpen(true)
              }}
              className="btn-primary !h-9 px-4 text-[13px] font-bold shrink-0"
            >
              <Plus className="h-4 w-4" />
              Reportar Alerta
            </button>

            <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--body)] hover:text-[var(--ink)] cursor-pointer whitespace-nowrap bg-[var(--elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-1.5 hover:bg-[var(--surface-hover)] transition-all">
              <input
                type="checkbox"
                checked={showZones}
                onChange={(e) => setShowZones(e.target.checked)}
                className="rounded border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <Layers className="h-4 w-4" />
              Mostrar zonas
            </label>
          </div>
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
          {isSelectingLocation && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-3 bg-[var(--elevated)] border-2 border-[var(--accent)] px-4 py-2.5 rounded-xl shadow-premium-lg">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent)]"></span>
              </span>
              <span className="text-xs font-bold text-[var(--ink)]">
                Haz clic en el mapa para fijar la ubicación del incidente
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSelectingLocation(false)
                  setIsCreateModalOpen(true)
                }}
                className="btn-secondary !h-7 !px-2.5 text-[11px]"
              >
                Cancelar
              </button>
            </div>
          )}

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
              placementMode={isPlacingReference || isSelectingLocation}
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

      {/* Modal para Crear Alerta */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="admin-card w-full max-w-[480px] bg-[var(--elevated)] border border-[var(--border)] rounded-2xl shadow-premium-lg overflow-hidden my-8 animate-slide-up">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 bg-[var(--surface-hover)]">
              <h2 className="text-sm font-bold text-[var(--ink)] tracking-tight">Reportar nuevo incidente</h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3 text-xs text-red-700 dark:text-red-300">
                  {submitError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--ink)] uppercase tracking-wide">Tipo de incidente</label>
                <select
                  value={createType}
                  onChange={(e) => setCreateType(e.target.value)}
                  className="filter-select !h-10 text-sm"
                  required
                >
                  <option value="">Seleccionar tipo...</option>
                  {reportTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--ink)] uppercase tracking-wide">Ubicación del incidente</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setIsSelectingLocation(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)] hover:bg-[var(--accent-soft)]/20 px-3 py-2 text-xs font-bold text-[var(--accent)] transition-all"
                >
                  <MapPin className="h-4 w-4 animate-bounce" />
                  Elegir punto haciendo clic en el mapa
                </button>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[var(--muted)] font-medium">Latitud</span>
                    <input
                      type="number"
                      step="any"
                      value={createLatitude}
                      onChange={(e) => setCreateLatitude(e.target.value)}
                      className="filter-input !h-9 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-[var(--muted)] font-medium">Longitud</span>
                    <input
                      type="number"
                      step="any"
                      value={createLongitude}
                      onChange={(e) => setCreateLongitude(e.target.value)}
                      className="filter-input !h-9 text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--ink)] uppercase tracking-wide">Barrio / Zona</label>
                <input
                  type="text"
                  placeholder="ej. Equipetrol, 24 de Septiembre"
                  value={createZone}
                  onChange={(e) => setCreateZone(e.target.value)}
                  className="filter-input !h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-[var(--ink)] uppercase tracking-wide">Descripción</label>
                  <span className="text-[10px] text-[var(--muted)]">{createDescription.length}/250</span>
                </div>
                <textarea
                  maxLength={250}
                  rows={3}
                  placeholder="Describe brevemente lo que ocurre..."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[var(--border-strong)] bg-[var(--elevated)] text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all resize-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--ink)] uppercase tracking-wide">Foto del incidente</label>
                {!imagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--accent)] rounded-xl cursor-pointer bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-6 w-6 text-[var(--muted)] mb-2" />
                      <p className="text-xs text-[var(--muted)] font-semibold">Subir foto (.png, .jpg, .jpeg)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setCreateFile(file)
                          setImagePreview(URL.createObjectURL(file))
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[var(--border-strong)]">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setCreateFile(null)
                        setImagePreview('')
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 btn-secondary !h-10 text-xs"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary !h-10 text-xs font-bold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Guardando…
                    </span>
                  ) : (
                    'Reportar incidente'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardPageShell>
  )
}
