import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { computeZoneRegions } from '../utils/zones'
import { useTheme } from '../context/ThemeContext'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const DEFAULT_CENTER = [-17.7833, -63.1821]

function createPinIcon(color) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:14px;height:14px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.35)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function MapController({ reports, searchCenter, searchRadiusMeters }) {
  const map = useMap()

  useEffect(() => {
    if (searchCenter && searchRadiusMeters) {
      map.setView([searchCenter.latitude, searchCenter.longitude], 14)
      return
    }
    const points = reports
      .map((r) => {
        const lng = r.coordinates?.[0]
        const lat = r.coordinates?.[1]
        if (lng == null || lat == null) return null
        return [lat, lng]
      })
      .filter(Boolean)
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 14)
      return
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 })
  }, [map, reports, searchCenter, searchRadiusMeters])

  return null
}

function MapClickHandler({ placementMode, onPlacementClick, onZoneSelect, zoneRegions, selectedZone }) {
  useMapEvents({
    click(e) {
      if (placementMode) {
        onPlacementClick?.(e.latlng.lat, e.latlng.lng)
        return
      }
      if (!onZoneSelect) return
      const click = e.latlng
      for (const zone of zoneRegions) {
        const center = L.latLng(zone.center[0], zone.center[1])
        if (click.distanceTo(center) <= zone.radius) {
          onZoneSelect(selectedZone === zone.name ? null : zone.name)
          return
        }
      }
    },
  })
  return null
}

export default function MapaInteractivoLeaflet({
  className = '',
  showZones = true,
  selectedZone = null,
  onZoneSelect,
  externalReports = [],
  externalLoading = false,
  searchCenter = null,
  searchRadiusMeters = null,
  placementMode = false,
  onPlacementClick,
  showReferenceMarker = false,
}) {
  const { isDark } = useTheme()
  const [selectedReport, setSelectedReport] = useState(null)

  const reports = externalReports ?? []
  const zoneRegions = useMemo(() => computeZoneRegions(reports), [reports])

  const filteredReports = useMemo(() => {
    if (!selectedZone) return reports
    return reports.filter((r) => (r.zone?.trim() || 'Sin zona') === selectedZone)
  }, [reports, selectedZone])

  const reportZoneColor = useCallback(
    (report) => {
      const name = report.zone?.trim() || 'Sin zona'
      return zoneRegions.find((z) => z.name === name)?.color ?? '#2563eb'
    },
    [zoneRegions],
  )

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  const center = searchCenter
    ? [searchCenter.latitude, searchCenter.longitude]
    : DEFAULT_CENTER

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {externalLoading && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-[var(--elevated)]/80 backdrop-blur-sm">
          <div className="h-9 w-9 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {placementMode && (
        <div className="absolute top-3 left-1/2 z-[500] -translate-x-1/2 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
          Toca el mapa para colocar el punto de referencia
        </div>
      )}

      <MapContainer
        center={center}
        zoom={13}
        style={{ width: '100%', height: '100%', minHeight: 320 }}
        className="z-0"
      >
        <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url={tileUrl} />

        <MapController
          reports={filteredReports}
          searchCenter={searchCenter}
          searchRadiusMeters={searchRadiusMeters}
        />
        <MapClickHandler
          placementMode={placementMode}
          onPlacementClick={onPlacementClick}
          onZoneSelect={onZoneSelect}
          zoneRegions={zoneRegions}
          selectedZone={selectedZone}
        />

        {searchCenter && searchRadiusMeters && (
          <Circle
            center={[searchCenter.latitude, searchCenter.longitude]}
            radius={searchRadiusMeters}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.12, weight: 2 }}
          />
        )}

        {showReferenceMarker && searchCenter && (
          <Marker position={[searchCenter.latitude, searchCenter.longitude]} />
        )}

        {showZones &&
          zoneRegions.map((zone) => {
            const active = !selectedZone || selectedZone === zone.name
            return (
              <Circle
                key={zone.name}
                center={zone.center}
                radius={zone.radius}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.color,
                  fillOpacity: active ? 0.18 : 0.05,
                  weight: active ? 2 : 1,
                  opacity: active ? 0.85 : 0.35,
                }}
                eventHandlers={{
                  click: () => onZoneSelect?.(selectedZone === zone.name ? null : zone.name),
                }}
              />
            )
          })}

        {filteredReports.map((report) => {
          const lng = report.coordinates?.[0]
          const lat = report.coordinates?.[1]
          if (lng == null || lat == null) return null
          const color = reportZoneColor(report)
          return (
            <Marker
              key={report.id}
              position={[lat, lng]}
              icon={createPinIcon(color)}
              eventHandlers={{ click: () => setSelectedReport(report) }}
            >
              {selectedReport?.id === report.id && (
                <Popup>
                  <div className="min-w-[200px] p-1">
                    <p className="text-xs font-bold mb-1" style={{ color }}>
                      {report.type?.name || 'Alerta'}
                    </p>
                    <p className="text-sm font-medium text-zinc-800 mb-1">{report.description}</p>
                    <p className="text-xs text-zinc-500">Zona: {report.zone || 'Sin zona'}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                </Popup>
              )}
            </Marker>
          )
        })}
      </MapContainer>

      <div className="absolute bottom-3 right-3 z-[400] flex flex-col items-end gap-1">
        <span className="rounded-lg bg-[var(--elevated)] border border-[var(--border)] px-2 py-1 text-[10px] font-medium text-[var(--muted)] shadow-sm">
          Mapa CARTO · sin token Mapbox
        </span>
      </div>
    </div>
  )
}
