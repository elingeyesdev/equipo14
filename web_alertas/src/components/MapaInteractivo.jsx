// Mapbox 3D si hay token; Leaflet/CARTO gratuito si no
import { lazy, Suspense } from 'react'
import MapaInteractivoLeaflet from './MapaInteractivoLeaflet'

const MapaInteractivoMapbox = lazy(() => import('./MapaInteractivoMapbox'))

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN?.trim()

export default function MapaInteractivo(props) {
  if (!MAPBOX_TOKEN) {
    return <MapaInteractivoLeaflet {...props} />
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-[var(--muted)]">
          Cargando mapa Mapbox 3D…
        </div>
      }
    >
      <MapaInteractivoMapbox {...props} />
    </Suspense>
  )
}
