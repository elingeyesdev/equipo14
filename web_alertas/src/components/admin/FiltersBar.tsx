import { Search, SlidersHorizontal, Calendar, X } from "lucide-react";
import { useFilters, type Filters } from "@/context/FilterContext";
import { useReports } from "@/hooks/useReports";
import { useReportTypes } from "@/hooks/useReportTypes";
import { categories } from "@/lib/admin-mock";

interface FiltersBarProps {
  onClose?: () => void;
}

export function FiltersBar({ onClose }: FiltersBarProps) {
  const { filters, setFilters, clearFilters } = useFilters();

  // Fetch all reports to extract unique zones dynamically
  const { reports: allReports = [] } = useReports({ includeDeleted: true }, { enabled: true });

  // Fetch report types for specific type selector
  const { reportTypes = [] } = useReportTypes();

  // Fetch active filtered reports to show correct total count
  const { reports: filteredReports = [] } = useReports({
    ...filters,
    includeDeleted: true,
  });

  // Extract unique zones
  const uniqueZones = Array.from(
    new Set(allReports.map((r) => r.zone).filter(Boolean))
  ).sort();

  const handleFilterChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      
      // If category is changed, clear specific typeId to avoid mismatch
      if (key === "category") {
        next.typeId = "";
      }
      
      return next;
    });
  };

  const activeCategory = filters.category || "Todos";

  return (
    <aside className="bg-card border border-border rounded-2xl p-5 lg:sticky lg:top-24 lg:self-start">
      <div className="flex items-center justify-between mb-5 pb-5 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-lg bg-muted grid place-items-center shrink-0">
            <SlidersHorizontal className="size-4 text-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-sm">Filtros</h3>
            <p className="text-xs text-muted-foreground truncate">
              {filteredReports.length} resultados
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onClose?.()}
          title="Cerrar filtros"
          className="size-8 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground grid place-items-center transition-colors cursor-pointer"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Buscar..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="w-full h-10 pl-10 pr-3 rounded-xl bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="mb-5">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Categoría
        </span>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => handleFilterChange("category", c.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                activeCategory === c.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Tipo específico
          </span>
          <select
            value={filters.typeId}
            onChange={(e) => handleFilterChange("typeId", e.target.value)}
            className="mt-1.5 w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer"
          >
            <option value="">Todos los tipos</option>
            {reportTypes.map((type) => (
              <option key={type.id} value={type.id.toString()}>
                {type.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Estado
          </span>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="mt-1.5 w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Verificado">Verificado</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </label>


        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Zona (texto en reporte)
          </span>
          <select
            value={filters.zone}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                zone: e.target.value,
              }))
            }
            className="mt-1.5 w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer"
          >
            <option value="Todas">Todas las zonas</option>
            {uniqueZones.map((zoneName) => (
              <option key={zoneName} value={zoneName}>
                {zoneName}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Calendar className="size-3" />
              Desde
            </span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleFilterChange("from", e.target.value)}
              className="mt-1.5 w-full h-10 px-3 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Calendar className="size-3" />
              Hasta
            </span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleFilterChange("to", e.target.value)}
              className="mt-1.5 w-full h-10 px-3 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={clearFilters}
        className="mt-4 w-full h-9 rounded-xl border border-dashed border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
      >
        Limpiar filtros
      </button>
    </aside>
  );
}