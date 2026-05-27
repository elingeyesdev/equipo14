// Mapbox GL 3D — Standard style + terrain + buildings
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, { Layer, Marker, NavigationControl, Popup, Source } from 'react-map-gl/mapbox'
import { LngLatBounds } from 'mapbox-gl'
import circle from '@turf/circle'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getAllReports, getNearbyReports } from '../api/reports'
import { computeZoneRegions } from '../utils/zones'
import { useTheme } from '../context/ThemeContext'
import {
  enableMapbox3D,
  fitBounds3D,
  flyTo3DView,
  MAP_3D_VIEW,
} from '../utils/mapbox3d'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN?.trim()
const MAP_STYLE = 'mapbox://styles/mapbox/standard'

const DEFAULT_CENTER = { latitude: -17.7833, longitude: -63.1821 }

function createZonesGeoJSON(zoneRegions, selectedZone) {
  const features = zoneRegions.map((zone) => {
    const polygon = circle([zone.center[1], zone.center[0]], zone.radius, {
      steps: 64,
      units: 'meters',
    })
    return {
      ...polygon,
      properties: {
        name: zone.name,
        color: zone.color,
        active: !selectedZone || selectedZone === zone.name,
      },
    }
  })

  return { type: 'FeatureCollection', features }
}

function createSearchCircleGeoJSON(center, radiusMeters) {
  if (!center || !radiusMeters) return null
  const polygon = circle([center.longitude, center.latitude], radiusMeters, {
    steps: 64,
    units: 'meters',
  })
  return { type: 'FeatureCollection', features: [polygon] }
}

function ReportMarker({ color }) {
  return (
    <span
      className="block h-4 w-4 rounded-full border-2 border-white shadow-lg ring-2 ring-black/10"
      style={{ background: color }}
    />
  )
}

function ReferencePointMarker({ pending = false }) {
  return (
    <div className="map-ref-marker" title="Punto de referencia">
      <span
        className="map-ref-marker__pin"
        style={{
          background: pending ? '#f59e0b' : 'var(--accent)',
          opacity: pending ? 0.85 : 1,
        }}
      />
      <span className="map-ref-marker__dot" />
    </div>
  )
}

export default function MapaInteractivoMapbox({
  className = '',
  showZones = true,
  selectedZone = null,
  onZoneSelect,
  useAllReports = false,
  compact = false,
  externalReports = null,
  externalLoading = false,
  searchCenter = null,
  searchRadiusMeters = null,
  placementMode = false,
  onPlacementClick,
  showReferenceMarker = false,
}) {
  const { isDark } = useTheme()
  const mapRef = useRef(null)
  const [internalReports, setInternalReports] = useState([])
  const [internalLoading, setInternalLoading] = useState(!externalReports)
  const [selectedReport, setSelectedReport] = useState(null)
  const [mapReady, setMapReady] = useState(false)

  const reports = externalReports ?? internalReports
  const loading = externalReports ? externalLoading : internalLoading

  const initialViewState = useMemo(
    () => ({
      longitude: DEFAULT_CENTER.longitude,
      latitude: DEFAULT_CENTER.latitude,
      zoom: compact ? 15 : MAP_3D_VIEW.zoom,
      pitch: MAP_3D_VIEW.pitch,
      bearing: MAP_3D_VIEW.bearing,
    }),
    [compact],
  )

  const loadReports = useCallback(
    async (lat, lng) => {
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
    },
    [useAllReports],
  )

  const getMapInstance = useCallback(() => {
    const ref = mapRef.current
    return ref?.getMap?.() ?? ref
  }, [])

  const setup3D = useCallback(
    (map) => {
      enableMapbox3D(map, { dark: isDark })
    },
    [isDark],
  )

  const fitToReports = useCallback(
    (list) => {
      const map = getMapInstance()
      if (!map || !list?.length) return

      const bounds = new LngLatBounds()
      let hasPoint = false

      list.forEach((r) => {
        const lng = r.coordinates?.[0]
        const lat = r.coordinates?.[1]
        if (lng == null || lat == null || Number.isNaN(lng) || Number.isNaN(lat)) return
        bounds.extend([lng, lat])
        hasPoint = true
      })

      if (!hasPoint) return
      fitBounds3D(map, bounds)
    },
    [getMapInstance],
  )

  useEffect(() => {
    if (externalReports) return

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          if (mapReady) {
            const map = getMapInstance()
            if (map) flyTo3DView(map, [longitude, latitude])
          }
          loadReports(latitude, longitude)
        },
        () => loadReports(DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude),
      )
    } else {
      loadReports(DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude)
    }
  }, [loadReports, externalReports, mapReady, getMapInstance])

  useEffect(() => {
    if (!mapReady || reports.length === 0) return
    fitToReports(reports)
  }, [reports, fitToReports, mapReady])

  useEffect(() => {
    const map = getMapInstance()
    if (!map || !mapReady) return
    setup3D(map)
  }, [isDark, mapReady, setup3D, getMapInstance])

  useEffect(() => {
    if (!mapReady || !searchCenter || !searchRadiusMeters) return
    const map = getMapInstance()
    if (!map) return
    const zoom = Math.min(
      16,
      Math.max(13, 15 - Math.log10(searchRadiusMeters / 1000) * 0.8),
    )
    flyTo3DView(map, [searchCenter.longitude, searchCenter.latitude], { zoom })
  }, [searchCenter?.latitude, searchCenter?.longitude, mapReady, getMapInstance, searchRadiusMeters])

  const zoneRegions = useMemo(() => computeZoneRegions(reports), [reports])

  const zonesGeoJSON = useMemo(
    () => (showZones ? createZonesGeoJSON(zoneRegions, selectedZone) : null),
    [showZones, zoneRegions, selectedZone],
  )

  const searchCircleGeoJSON = useMemo(
    () => createSearchCircleGeoJSON(searchCenter, searchRadiusMeters),
    [searchCenter, searchRadiusMeters],
  )

  const filteredReports = useMemo(() => {
    if (!selectedZone) return reports
    return reports.filter((r) => (r.zone?.trim() || 'Sin zona') === selectedZone)
  }, [reports, selectedZone])

  const reportZoneColor = useCallback(
    (report) => {
      const name = report.zone?.trim() || 'Sin zona'
      const region = zoneRegions.find((z) => z.name === name)
      return region?.color ?? '#2563eb'
    },
    [zoneRegions],
  )

  const handleMapClick = useCallback(
    (evt) => {
      if (placementMode && evt.lngLat) {
        onPlacementClick?.(evt.lngLat.lat, evt.lngLat.lng)
        return
      }
      const feature = evt.features?.[0]
      if (feature?.layer?.id === 'zones-fill' && feature.properties?.name) {
        const name = feature.properties.name
        onZoneSelect?.(selectedZone === name ? null : name)
      }
    },
    [placementMode, onPlacementClick, onZoneSelect, selectedZone],
  )

  return (
    <div className={`relative overflow-hidden rounded-xl mapbox-3d-root ${className}`}>
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--elevated)]/80 backdrop-blur-sm">
          <div className="h-9 w-9 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {placementMode && (
        <div className="absolute top-14 left-1/2 z-20 -translate-x-1/2 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
          Toca el mapa para colocar el punto de referencia
        </div>
      )}

      <Map
        key={`mapbox-standard-${isDark ? 'night' : 'day'}`}
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={initialViewState}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%', minHeight: 320 }}
        attributionControl
        antialias
        onLoad={(evt) => {
          const map = evt.target
          setMapReady(true)
          setup3D(map)
          if (reports.length) fitToReports(reports)
        }}
        onStyleData={(evt) => {
          if (evt.target.isStyleLoaded()) setup3D(evt.target)
        }}
        onClick={handleMapClick}
        interactiveLayerIds={placementMode ? [] : showZones ? ['zones-fill'] : []}
        cursor={placementMode ? 'crosshair' : 'pointer'}
      >
        <NavigationControl position="top-left" visualizePitch showCompass />

        {searchCircleGeoJSON && (
          <Source id="search-radius" type="geojson" data={searchCircleGeoJSON}>
            <Layer
              id="search-radius-fill"
              type="fill"
              slot="middle"
              paint={{ 'fill-color': '#3b82f6', 'fill-opacity': 0.14 }}
            />
            <Layer
              id="search-radius-outline"
              type="line"
              slot="middle"
              paint={{ 'line-color': '#3b82f6', 'line-width': 2.5, 'line-opacity': 0.7 }}
            />
          </Source>
        )}

        {showReferenceMarker && searchCenter && (
          <Marker
            longitude={searchCenter.longitude}
            latitude={searchCenter.latitude}
            anchor="bottom"
          >
            <ReferencePointMarker pending={placementMode} />
          </Marker>
        )}

        {showZones && zonesGeoJSON && (
          <Source id="zones" type="geojson" data={zonesGeoJSON}>
            <Layer
              id="zones-fill"
              type="fill"
              slot="middle"
              paint={{
                'fill-color': ['get', 'color'],
                'fill-opacity': ['case', ['get', 'active'], 0.22, 0.06],
              }}
            />
            <Layer
              id="zones-outline"
              type="line"
              slot="middle"
              paint={{
                'line-color': ['get', 'color'],
                'line-width': ['case', ['get', 'active'], 3, 1],
                'line-opacity': ['case', ['get', 'active'], 0.9, 0.4],
              }}
            />
          </Source>
        )}

        {filteredReports.map((report) => {
          const lng = report.coordinates?.[0]
          const lat = report.coordinates?.[1]
          if (lng == null || lat == null || Number.isNaN(lng) || Number.isNaN(lat)) return null
          const color = reportZoneColor(report)

          return (
            <Marker
              key={report.id}
              longitude={lng}
              latitude={lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                setSelectedReport(report)
              }}
            >
              <ReportMarker color={color} />
            </Marker>
          )
        })}

        {selectedReport && (
          <Popup
            longitude={selectedReport.coordinates[0]}
            latitude={selectedReport.coordinates[1]}
            anchor="bottom"
            onClose={() => setSelectedReport(null)}
            closeOnClick={false}
            maxWidth="280px"
          >
            <div className="min-w-[200px] p-1 text-[var(--ink)]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{
                    background: `${reportZoneColor(selectedReport)}22`,
                    color: reportZoneColor(selectedReport),
                  }}
                >
                  {selectedReport.type?.name || 'Alerta'}
                </span>
                {selectedReport.verified && (
                  <span className="text-[10px] font-semibold text-green-600">Verificado</span>
                )}
              </div>
              <p className="text-sm font-medium mb-1">{selectedReport.description}</p>
              <p className="text-xs text-[var(--muted)] mb-1">
                <strong>Zona:</strong> {selectedReport.zone || 'Sin zona'}
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                {new Date(selectedReport.created_at).toLocaleString()}
              </p>
              {selectedReport.images?.[0]?.url && (
                <img
                  src={selectedReport.images[0].url}
                  alt="Evidencia"
                  className="w-full h-20 object-cover mt-2 rounded-lg"
                />
              )}
            </div>
          </Popup>
        )}
      </Map>

      <div className="absolute bottom-3 right-3 z-10">
        <span className="rounded-lg bg-[#2563eb] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
          Mapbox 3D
        </span>
      </div>
    </div>
  )
}
