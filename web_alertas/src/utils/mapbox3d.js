/** Activa relieve + edificios 3D en Mapbox GL JS v3 */
export function enableMapbox3D(map, { dark = false } = {}) {
  const apply = () => {
    try {
      if (typeof map.setConfigProperty === 'function') {
        map.setConfigProperty('basemap', 'lightPreset', dark ? 'night' : 'day')
        map.setConfigProperty('basemap', 'show3dBuildings', true)
        map.setConfigProperty('basemap', 'show3dObjects', true)
        map.setConfigProperty('basemap', 'show3dLandmarks', true)
      }
    } catch (err) {
      console.warn('[mapbox3d] config Standard:', err)
    }

    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      })
    }

    map.setTerrain({ source: 'mapbox-dem', exaggeration: 2.2 })

    map.setFog({
      color: dark ? 'rgb(12, 20, 35)' : 'rgb(220, 235, 255)',
      'high-color': dark ? 'rgb(36, 60, 120)' : 'rgb(120, 170, 230)',
      'horizon-blend': 0.04,
      'space-color': dark ? 'rgb(8, 10, 20)' : 'rgb(180, 200, 230)',
      'star-intensity': dark ? 0.35 : 0,
    })

    if (!map.getLayer('3d-buildings-custom') && map.getSource('composite')) {
      const labelLayerId = map
        .getStyle()
        ?.layers?.find((l) => l.type === 'symbol' && l.layout?.['text-field'])?.id

      map.addLayer(
        {
          id: '3d-buildings-custom',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', ['get', 'extrude'], 'true'],
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': dark ? '#94a3b8' : '#e2e8f0',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14,
              0,
              14.5,
              ['get', 'height'],
            ],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.85,
          },
        },
        labelLayerId,
      )
    }
  }

  if (map.isStyleLoaded()) apply()
  else map.once('style.load', apply)
}

export const MAP_3D_VIEW = {
  pitch: 68,
  bearing: -32,
  zoom: 16,
  minZoomForBuildings: 15,
}

export function flyTo3DView(map, center, options = {}) {
  const [lng, lat] = center
  const zoom = Math.max(options.zoom ?? MAP_3D_VIEW.zoom, MAP_3D_VIEW.minZoomForBuildings)

  map.flyTo({
    center: [lng, lat],
    zoom,
    pitch: MAP_3D_VIEW.pitch,
    bearing: MAP_3D_VIEW.bearing,
    duration: options.duration ?? 1400,
    essential: true,
  })
}

export function fitBounds3D(map, bounds, padding = 72) {
  map.fitBounds(bounds, {
    padding: { top: padding, bottom: padding, left: padding, right: padding },
    pitch: MAP_3D_VIEW.pitch,
    bearing: MAP_3D_VIEW.bearing,
    duration: 1200,
    maxZoom: 17.5,
  })

  map.once('moveend', function ensureZoom() {
    if (map.getZoom() < MAP_3D_VIEW.minZoomForBuildings) {
      map.easeTo({
        zoom: MAP_3D_VIEW.minZoomForBuildings,
        pitch: MAP_3D_VIEW.pitch,
        bearing: MAP_3D_VIEW.bearing,
        duration: 900,
      })
    }
  })
}
