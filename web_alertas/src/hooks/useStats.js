import { useMemo } from 'react'

export function useStats(reports) {
  return useMemo(() => {
    if (!reports || reports.length === 0) {
      return {
        total: 0,
        verified: 0,
        verifiedPct: '0%',
        zones: 0,
        today: 0,
        byType: {},
      }
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const total = reports.length
    const verified = reports.filter((r) => r.verified).length
    const verifiedPct = total > 0 ? `${Math.round((verified / total) * 100)}%` : '0%'

    const zonesSet = new Set(reports.map((r) => r.zone).filter(Boolean))
    const zones = zonesSet.size

    const today = reports.filter((r) => {
      const d = new Date(r.created_at)
      return d >= todayStart
    }).length

    const byType = reports.reduce((acc, r) => {
      const typeName = r.type?.name || 'Otros'
      acc[typeName] = (acc[typeName] || 0) + 1
      return acc
    }, {})

    return { total, verified, verifiedPct, zones, today, byType }
  }, [reports])
}
