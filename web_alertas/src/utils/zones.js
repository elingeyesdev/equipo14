const ZONE_COLORS = [
  '#2563eb',
  '#ea580c',
  '#7c3aed',
  '#0891b2',
  '#be185d',
  '#65a30d',
  '#ca8a04',
  '#dc2626',
]

function hashZone(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h)
  }
  return Math.abs(h)
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function groupReportsByZone(reports) {
  const groups = {}
  for (const report of reports) {
    const zone = report.zone?.trim() || 'Sin zona'
    if (!groups[zone]) groups[zone] = []
    groups[zone].push(report)
  }
  return groups
}

/** Agrupa reportes por campo `zone` del backend y calcula círculos de cobertura */
export function computeZoneRegions(reports) {
  const groups = groupReportsByZone(reports)
  const regions = []

  for (const [name, items] of Object.entries(groups)) {
    const valid = items.filter((r) => r.coordinates?.length >= 2)
    if (valid.length === 0) continue

    const lats = valid.map((r) => r.coordinates[1])
    const lngs = valid.map((r) => r.coordinates[0])
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length

    let maxDist = 200
    for (const r of valid) {
      const d = haversineMeters(centerLat, centerLng, r.coordinates[1], r.coordinates[0])
      if (d > maxDist) maxDist = d
    }

    const radius = Math.min(Math.max(maxDist + 180, 400), 3000)

    regions.push({
      name,
      center: [centerLat, centerLng],
      radius,
      count: valid.length,
      verified: valid.filter((r) => r.verified).length,
      color: ZONE_COLORS[hashZone(name) % ZONE_COLORS.length],
      reportIds: valid.map((r) => r.id),
    })
  }

  return regions.sort((a, b) => b.count - a.count)
}

export function getZoneColor(name) {
  return ZONE_COLORS[hashZone(name) % ZONE_COLORS.length]
}
