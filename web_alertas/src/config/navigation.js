export const NAV_ITEMS = [
  { path: '/', label: 'Inicio', end: true },
  { path: '/mapa', label: 'Mapa en vivo' },
  { path: '/metricas', label: 'Métricas' },
  { path: '/admin', label: 'Panel Admin' },
  { path: '/reportes', label: 'Reportes' },
]

/** Anclas de la landing (scroll en inicio) */
export const LANDING_SECTIONS = [
  { id: 'beneficios', label: 'Producto' },
  { id: 'mapa-live', label: 'Mapa' },
  { id: 'tecnologia', label: 'Tecnología' },
]

export const CTA_PATH = '/descarga'

export function scrollToLandingSection(id) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
