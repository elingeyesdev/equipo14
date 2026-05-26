/** Nombres de rol según seed del backend */
export const ROLES = {
  USER: 'usuario',
  AUTHORITY: 'autoridad',
}

export function isAuthority(role) {
  return role?.name === ROLES.AUTHORITY || role === ROLES.AUTHORITY
}

export function getNavForRole(role) {
  const authority = isAuthority(role)
  const base = [
    { path: '/mapa', label: 'Mapa en vivo' },
    { path: '/metricas', label: 'Métricas' },
  ]
  if (authority) {
    return [
      ...base,
      { path: '/admin', label: 'Panel Admin' },
      { path: '/reportes', label: 'Reportes' },
    ]
  }
  return base
}
