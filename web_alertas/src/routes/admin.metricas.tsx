import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TrendingUp, CheckCircle2, MapPin, Clock, Loader2 } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { reportsService } from "@/services/reports.service";
import { FilterButton } from "@/components/admin/FilterButton";
import { ReportsFilterSheet } from "@/components/admin/ReportsFilterSheet";
import { AdminApiBanner } from "@/components/admin/AdminApiBanner";
import { useFilters } from "@/context/FilterContext";

export const Route = createFileRoute("/admin/metricas")({
  component: MetricasPage,
});

export default function MetricasPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { filters, activeCount } = useFilters();
  const { reports = [], isLoading, isError, error, refetch } = useReports({
    ...filters,
    includeDeleted: true,
  });

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-muted-foreground text-sm gap-2">
        <Loader2 className="size-4 animate-spin" />
        Calculando estadísticas...
      </div>
    );
  }

  // Calculate KPIs and activity distribution dynamically via reportsService
  const kpisData = reportsService.calculateKPIs(reports);
  const activity = reportsService.calculateActivityDistribution(reports);
  
  const kpis = [
    { value: kpisData.total.toString(), label: "Alertas totales", sub: "En el sistema", icon: TrendingUp },
    { value: kpisData.todayCount.toString(), label: "Alertas hoy", sub: "Registradas hoy", icon: Clock },
    { value: `${kpisData.verifiedPercentage}%`, label: "Verificación", sub: "Confirmadas por autoridad", icon: CheckCircle2 },
    { value: kpisData.uniqueZonesCount.toString(), label: "Zonas cubiertas", sub: "Con incidentes activos", icon: MapPin },
  ];

  const maxCount = Math.max(...activity.map((a) => a.count), 1);

  const totals = [
    { label: "Total", value: kpisData.total.toString() },
    { label: "Verificados", value: kpisData.verifiedCount.toString() },
    { label: "Pendientes", value: kpisData.pendingCount.toString() },
  ];

  const microCards = [
    { value: kpisData.verifiedCount.toString(), label: "Verificados" },
    { value: kpisData.uniqueZonesCount.toString(), label: "Zonas activas" },
    { value: kpisData.total.toString(), label: "Total en sistema" },
  ];

  return (
    <div>
      {isError && (
        <AdminApiBanner
          message={`No se pudieron cargar los reportes: ${error?.message ?? "error desconocido"}`}
          onRetry={() => refetch()}
        />
      )}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Inteligencia · Métricas
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Impacto medible en la comunidad
          </h1>
          <p className="text-muted-foreground text-sm">
            Estadísticas calculadas en tiempo real a partir del backend de Alertas.
          </p>
        </div>
        <FilterButton activeCount={activeCount} onClick={() => setFiltersOpen(true)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="size-10 rounded-lg bg-muted grid place-items-center">
                  <k.icon className="size-4 text-primary" />
                </div>
              </div>
              <div className="font-display text-5xl font-bold text-primary mb-2 leading-none">
                {k.value}
              </div>
              <div className="text-sm font-bold mb-1">{k.label}</div>
              <div className="text-xs text-muted-foreground">{k.sub}</div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display font-bold text-sm">Actividad por tipo</h3>
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
              Totales
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-6">{kpisData.total} reportes en vista</p>
          
          {activity.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              Sin datos de incidentes para graficar
            </div>
          ) : (
            <ul className="space-y-4 mb-6 max-h-[280px] overflow-y-auto pr-1">
              {activity.map((a) => (
                <li key={a.label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium truncate mr-2">{a.label}</span>
                    <span className="text-muted-foreground tabular-nums shrink-0">{a.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(a.count / maxCount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="grid grid-cols-3 gap-3 pt-5 border-t border-border">
            {totals.map((t) => (
              <div key={t.label}>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                  {t.label}
                </div>
                <div className="font-display text-2xl font-bold">{t.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {microCards.map((m, i) => (
          <div
            key={`${m.label}-${i}`}
            className="bg-muted/40 border border-border rounded-2xl p-5 text-center"
          >
            <div className="font-display text-3xl font-bold mb-1">{m.value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
              {m.label}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-6">
        {reports.length === 0 && !isError
          ? "No hay reportes. Crea uno desde el mapa con «Nueva alerta»."
          : "Incluye reportes archivados (expirados). Los activos en app móvil expiran a las 24 h."}
      </p>

      <ReportsFilterSheet open={filtersOpen} onOpenChange={setFiltersOpen} />
    </div>
  );
}