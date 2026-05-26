import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, X, Calendar, MapPin } from 'lucide-react'
import { INCIDENT_CATEGORIES, STATUS_OPTIONS } from '../../config/incidentCategories'
import { useReportFilters } from '../../context/ReportFilterContext'

export default function IncidentFilterBar({ wideGrid = true }) {
  const {
    filters,
    setFilter,
    clearFilters,
    activeChips,
    removeChip,
    zones,
    reportTypes,
    filteredReports,
    reports,
  } = useReportFilters()

  return (
    <motion.div
      layout
      className="admin-card filter-panel space-y-5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">Filtros de incidentes</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {filteredReports.length} de {reports.length} resultados
            </p>
          </div>
        </div>

        <div className="filter-search-wrap flex-1 lg:max-w-md lg:ml-auto">
          <Search className="filter-search-icon h-4 w-4" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Buscar por ID, descripción, zona, tipo…"
            className="filter-input !h-11"
          />
        </div>
      </div>

      <div className="filter-chips-row">
        {INCIDENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilter('category', cat.id)}
            className={[
              'filter-chip',
              filters.category === cat.id ? 'filter-chip-active' : '',
            ].join(' ')}
            title={cat.description}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className={`filter-grid ${wideGrid ? 'filter-grid--wide' : ''}`}>
        <label className="filter-field">
          <span className="filter-label">Tipo específico</span>
          <select
            value={filters.typeId}
            onChange={(e) => setFilter('typeId', e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los tipos</option>
            {reportTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span className="filter-label">Estado</span>
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            className="filter-select"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span className="filter-label">
            <MapPin className="inline h-3 w-3 mr-0.5 -mt-px" />
            Zona
          </span>
          <select
            value={filters.zone}
            onChange={(e) => setFilter('zone', e.target.value)}
            className="filter-select"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z === 'all' ? 'Todas las zonas' : z}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span className="filter-label">
            <Calendar className="inline h-3 w-3 mr-0.5 -mt-px" />
            Desde
          </span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilter('dateFrom', e.target.value)}
            className="filter-select"
          />
        </label>

        <label className="filter-field">
          <span className="filter-label">
            <Calendar className="inline h-3 w-3 mr-0.5 -mt-px" />
            Hasta
          </span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilter('dateTo', e.target.value)}
            className="filter-select"
          />
        </label>
      </div>

      <AnimatePresence>
        {activeChips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="filter-active-row"
          >
            <span className="text-xs font-semibold text-[var(--muted)]">Activos:</span>
            {activeChips.map((chip) => (
              <button
                key={chip.key + chip.label}
                type="button"
                onClick={() => removeChip(chip.key)}
                className="filter-active-chip"
              >
                {chip.label}
                <X className="h-3 w-3 opacity-60" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] underline-offset-2 hover:underline"
            >
              Limpiar todo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
