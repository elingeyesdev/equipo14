import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getAllReports } from '../api/reports'
import { getReportTypes } from '../api/reportTypes'
import { DEFAULT_FILTERS, filtersToQueryParams } from '../config/incidentCategories'
import { filterReports, getActiveFilterChips } from '../utils/filterReports'

const ReportFilterContext = createContext(null)

export function ReportFilterProvider({ children }) {
  const [reports, setReports] = useState([])
  const [reportTypes, setReportTypes] = useState([])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async (activeFilters) => {
    setLoading(true)
    setError(null)
    try {
      const params = filtersToQueryParams(activeFilters)
      const [reportsData, typesData] = await Promise.all([
        getAllReports(params),
        getReportTypes().catch(() => []),
      ])
      setReports(Array.isArray(reportsData) ? reportsData : [])
      setReportTypes(Array.isArray(typesData) ? typesData : [])
    } catch (err) {
      const msg = err.message || 'Error al cargar reportes'
      setError(
        msg.includes('Failed to fetch')
          ? 'No se pudo conectar al servidor. Verifica que el backend esté activo.'
          : msg,
      )
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchData(filters), 320)
    return () => clearTimeout(t)
  }, [filters, fetchData])

  const filteredReports = useMemo(
    () => filterReports(reports, filters),
    [reports, filters],
  )

  const zones = useMemo(() => {
    const set = new Set(reports.map((r) => r.zone?.trim() || 'Sin zona'))
    return ['all', ...Array.from(set).sort()]
  }, [reports])

  const activeChips = useMemo(
    () => getActiveFilterChips(filters, reportTypes),
    [filters, reportTypes],
  )

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'category' && value !== 'all') next.typeId = 'all'
      if (key === 'typeId' && value !== 'all') next.category = 'all'
      return next
    })
  }, [])

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  const removeChip = useCallback((key) => {
    if (key === 'date') {
      setFilters((prev) => ({ ...prev, dateFrom: '', dateTo: '' }))
      return
    }
    if (key === 'search') {
      setFilters((prev) => ({ ...prev, search: '' }))
      return
    }
    setFilter(key, 'all')
  }, [setFilter])

  const value = useMemo(
    () => ({
      reports,
      filteredReports,
      reportTypes,
      filters,
      setFilter,
      setFilters,
      clearFilters,
      activeChips,
      removeChip,
      zones,
      loading,
      error,
      refresh: () => fetchData(filters),
    }),
    [
      reports,
      filteredReports,
      reportTypes,
      filters,
      setFilter,
      clearFilters,
      activeChips,
      removeChip,
      zones,
      loading,
      error,
      fetchData,
    ],
  )

  return (
    <ReportFilterContext.Provider value={value}>{children}</ReportFilterContext.Provider>
  )
}

export function useReportFilters() {
  const ctx = useContext(ReportFilterContext)
  if (!ctx) {
    throw new Error('useReportFilters debe usarse dentro de ReportFilterProvider')
  }
  return ctx
}
