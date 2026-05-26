import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getAllReports, getNearbyReports } from '../api/reports'
import { computeZoneRegions } from '../utils/zones'
import { useTheme } from '../context/ThemeContext'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const DEFAULT_CENTER = [-17.7833, -63.1821]

function MapUpdater({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom())
  }, [center, zoom, map])
  return null
}

function createMarkerIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<span style="
      display:block;width:12px;height:12px;
      background:${color};border:2px solid white;
      border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.25);
    "></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

export default function MapaInteractivo({
  className = '',
  showZones = true,
  selectedZone = null,
  onZoneSelect,
  useAllReports = false,
  compact = false,
  externalReports = null,
  externalLoading = false,
}) {
  const { isDark } = useTheme()
  const [internalReports, setInternalReports] = useState([])
  const [internalLoading, setInternalLoading] = useState(!externalReports)
  const [center, setCenter] = useState(DEFAULT_CENTER)
  const [geoReady, setGeoReady] = useState(false)

  const reports = externalReports ?? internalReports
  const loading = externalReports ? externalLoading : internalLoading

  const loadReports = useCallback(async (lat, lng) => {
    setInternalLoading(true)
    try {
      const data = useAllReports
        ? await getAllReports()
        : await getNearbyReports(lat, lng, 50000)
      setInternalReports(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error cargando reportes:', err)
      setInternalReports([])
    } finally {
      setInternalLoading(false)
    }
  }, [useAllReports])

  useEffect(() => {
    if (externalReports) {
      if (externalReports.length > 0) {
        const lats = externalReports.map((r) => r.coordinates?.[1]).filter(Boolean)
        const lngs = externalReports.map((r) => r.coordinates?.[0]).filter(Boolean)
        if (lats.length) {
          setCenter([
            lats.reduce((a, b) => a + b, 0) / lats.length,
            lngs.reduce((a, b) => a + b, 0) / lngs.length,
          ])
        }
      }
      setGeoReady(true)
      return
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setCenter([lat, lng])
          setGeoReady(true)
          loadReports(lat, lng)
        },
        () => {
          setGeoReady(true)
          loadReports(DEFAULT_CENTER[0], DEFAULT_CENTER[1])
        }
      )
    } else {
      setGeoReady(true)
      loadReports(DEFAULT_CENTER[0], DEFAULT_CENTER[1])
    }
  }, [loadReports, externalReports])

  const zoneRegions = useMemo(() => computeZoneRegions(reports), [reports])

  const filteredReports = useMemo(() => {
    if (!selectedZone) return reports
    return reports.filter((r) => (r.zone?.trim() || 'Sin zona') === selectedZone)
  }, [reports, selectedZone])

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  const reportZoneColor = (report) => {
    const name = report.zone?.trim() || 'Sin zona'
    const region = zoneRegions.find((z) => z.name === name)
    return region?.color ?? '#2563eb'
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-[var(--elevated)]/80 backdrop-blur-sm">
          <div className="h-9 w-9 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <MapContainer
        center={center}
        zoom={compact ? 12 : 13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url={tileUrl}
        />
        {geoReady && <MapUpdater center={center} />}

        {showZones &&
          zoneRegions.map((zone) => {
            const isActive = !selectedZone || selectedZone === zone.name
            return (
              <Circle
                key={zone.name}
                center={zone.center}
                radius={zone.radius}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.color,
                  fillOpacity: isActive ? 0.14 : 0.04,
                  weight: isActive ? 2 : 1,
                  opacity: isActive ? 0.7 : 0.25,
                  dashArray: isActive ? undefined : '6 4',
                }}
                eventHandlers={{
                  click: () => onZoneSelect?.(selectedZone === zone.name ? null : zone.name),
                }}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                  <span className="text-xs font-semibold">
                    {zone.name} · {zone.count} alerta{zone.count !== 1 ? 's' : ''}
                  </span>
                </Tooltip>
              </Circle>
            )
          })}

        {filteredReports.map((report) => {
          const lng = report.coordinates?.[0]
          const lat = report.coordinates?.[1]
          if (lng == null || lat == null || Number.isNaN(lng) || Number.isNaN(lat)) return null
          const color = reportZoneColor(report)
          return (
            <Marker
              key={report.id}
              position={[report.coordinates[1], report.coordinates[0]]}
              icon={createMarkerIcon(color)}
            >
              <Popup>
                <div className="min-w-[200px] p-1">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ background: `${color}22`, color }}
                    >
                      {report.type?.name || 'Alerta'}
                    </span>
                    {report.verified && (
                      <span className="text-[10px] font-semibold text-green-600">Verificado</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-zinc-800 mb-1">{report.description}</p>
                  <p className="text-xs text-zinc-500 mb-1">
                    <strong>Zona:</strong> {report.zone || 'Sin zona'}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {new Date(report.created_at).toLocaleString()}
                  </p>
                  {report.images?.[0]?.url && (
                    <img
                      src={report.images[0].url}
                      alt="Evidencia"
                      className="w-full h-20 object-cover mt-2 rounded-lg"
                    />
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

export function MapZonePanel({ reports, selectedZone, onZoneSelect }) {
  const zones = useMemo(() => computeZoneRegions(reports), [reports])

  if (zones.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)] py-4 text-center leading-relaxed">
        Sin zonas con reportes.
        <br />
        <span className="text-xs">Crea alertas desde la app móvil o verifica que el backend esté activo.</span>
      </p>
    )
  }

  return (
    <ul className="space-y-1.5 max-h-[320px] overflow-y-auto">
      <li>
        <button
          type="button"
          onClick={() => onZoneSelect(null)}
          className={`w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            !selectedZone
              ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
              : 'text-[var(--body)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          Todas las zonas
          <span className="float-right text-xs opacity-70">{reports.length}</span>
        </button>
      </li>
      {zones.map((zone) => (
        <li key={zone.name}>
          <button
            type="button"
            onClick={() => onZoneSelect(zone.name)}
            className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
              selectedZone === zone.name
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--body)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: zone.color }}
              />
              <span className="font-medium truncate">{zone.name}</span>
            </span>
            <span className="mt-0.5 block text-xs opacity-70 pl-4">
              {zone.count} alertas · {zone.verified} verificadas
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
