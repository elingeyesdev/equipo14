import { INCIDENT_CATEGORIES } from '../config/incidentCategories'

/** Filtrado cliente instantáneo (misma lógica que el API NestJS) */
export function filterReports(reports, filters) {
  if (!reports?.length) return []

  return reports.filter((r) => {
    if (filters.status === 'verified' && !r.verified) return false
    if (filters.status === 'pending' && r.verified) return false

    const zoneName = r.zone?.trim() || 'Sin zona'
    if (filters.zone && filters.zone !== 'all' && zoneName !== filters.zone) return false

    if (filters.typeId && filters.typeId !== 'all') {
      if (String(r.type?.id) !== String(filters.typeId)) return false
    }

    if (filters.category && filters.category !== 'all') {
      const cat = INCIDENT_CATEGORIES.find((c) => c.id === filters.category)
      if (cat?.typeIds && !cat.typeIds.includes(r.type?.id)) return false
    }

    if (filters.dateFrom) {
      const from = new Date(`${filters.dateFrom}T00:00:00`)
      if (new Date(r.created_at) < from) return false
    }
    if (filters.dateTo) {
      const to = new Date(`${filters.dateTo}T23:59:59`)
      if (new Date(r.created_at) > to) return false
    }

    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase()
      const hay = [String(r.id), r.description, r.zone, r.type?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }

    return true
  })
}

export function getActiveFilterChips(filters, reportTypes = []) {
  const chips = []

  if (filters.category && filters.category !== 'all') {
    const cat = INCIDENT_CATEGORIES.find((c) => c.id === filters.category)
    chips.push({ key: 'category', label: cat?.label || filters.category })
  }
  if (filters.typeId && filters.typeId !== 'all') {
    const t = reportTypes.find((x) => String(x.id) === String(filters.typeId))
    chips.push({ key: 'typeId', label: t?.name || `Tipo #${filters.typeId}` })
  }
  if (filters.status && filters.status !== 'all') {
    chips.push({
      key: 'status',
      label: filters.status === 'verified' ? 'Verificados' : 'Pendientes',
    })
  }
  if (filters.zone && filters.zone !== 'all') {
    chips.push({ key: 'zone', label: filters.zone })
  }
  if (filters.dateFrom || filters.dateTo) {
    chips.push({
      key: 'date',
      label: [filters.dateFrom, filters.dateTo].filter(Boolean).join(' → '),
    })
  }
  if (filters.search?.trim()) {
    chips.push({ key: 'search', label: `"${filters.search.trim()}"` })
  }

  return chips
}
