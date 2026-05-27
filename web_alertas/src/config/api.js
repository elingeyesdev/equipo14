/** API backend — túnel Dev (Nest en :3000) */
export const API_TUNNEL_ORIGIN = 'https://715h83m3-3000.brs.devtunnels.ms'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || `${API_TUNNEL_ORIGIN}/api`
