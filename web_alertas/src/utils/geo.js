const EARTH_RADIUS_M = 6371000

/** Distancia en metros entre dos puntos WGS84 */
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}

/** Filtra reportes con coordinates [lng, lat] dentro del radio (metros) */
export function filterReportsByRadius(reports, center, radiusMeters) {
  if (!center || radiusMeters == null) return reports ?? []
  const { latitude, longitude } = center

  return (reports ?? []).filter((r) => {
    const lng = r.coordinates?.[0]
    const lat = r.coordinates?.[1]
    if (lng == null || lat == null || Number.isNaN(lng) || Number.isNaN(lat)) return false
    return distanceMeters(latitude, longitude, lat, lng) <= radiusMeters
  })
}

export const RADIUS_KM_MIN = 0.5
export const RADIUS_KM_MAX = 20
export const RADIUS_KM_DEFAULT = 5

export function clampRadiusKm(km) {
  return Math.min(RADIUS_KM_MAX, Math.max(RADIUS_KM_MIN, km))
}

export function radiusKmToMeters(km) {
  return Math.round(clampRadiusKm(km) * 1000)
}
