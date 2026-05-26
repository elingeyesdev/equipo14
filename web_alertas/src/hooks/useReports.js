import { useState, useEffect, useCallback } from 'react'
import { getAllReports } from '../api/reports'

export function useReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllReports()
      setReports(Array.isArray(data) ? data : [])
    } catch (err) {
      const msg = err.message || 'Error desconocido'
      setError(
        msg.includes('Failed to fetch')
          ? 'No se pudo conectar al servidor. Verifica que el túnel y el backend estén activos.'
          : msg
      )
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  return { reports, loading, error, refresh: fetchReports }
}
