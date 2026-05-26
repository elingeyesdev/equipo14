/** Categorías agrupadas — sincronizado con backend REPORT_CATEGORY_TYPE_IDS */
export const INCIDENT_CATEGORIES = [
  { id: 'all', label: 'Todos', description: 'Todos los incidentes' },
  { id: 'accidentes', label: 'Accidentes', description: 'Tránsito y vía', typeIds: [3, 7] },
  { id: 'robos', label: 'Robos y hurtos', description: 'Delitos patrimoniales', typeIds: [1, 4] },
  { id: 'incendios', label: 'Incendios', description: 'Estructural y forestal', typeIds: [2, 5] },
  { id: 'emergencias', label: 'Emergencias', description: 'Médicas y urbanas', typeIds: [6] },
]

export const STATUS_OPTIONS = [
  { id: 'all', label: 'Todos los estados' },
  { id: 'verified', label: 'Verificados' },
  { id: 'pending', label: 'Pendientes' },
]

export const DEFAULT_FILTERS = {
  search: '',
  category: 'all',
  typeId: 'all',
  status: 'all',
  zone: 'all',
  dateFrom: '',
  dateTo: '',
}

export function filtersToQueryParams(filters) {
  const params = {}
  if (filters.search?.trim()) params.search = filters.search.trim()
  if (filters.category && filters.category !== 'all') params.category = filters.category
  if (filters.typeId && filters.typeId !== 'all') params.typeId = String(filters.typeId)
  if (filters.status && filters.status !== 'all') params.status = filters.status
  if (filters.zone && filters.zone !== 'all') params.zone = filters.zone
  if (filters.dateFrom) params.from = filters.dateFrom
  if (filters.dateTo) params.to = filters.dateTo
  return params
}
