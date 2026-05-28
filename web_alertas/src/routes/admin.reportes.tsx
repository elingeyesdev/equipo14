import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, FileSpreadsheet, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFilters } from "@/context/FilterContext";
import { useReports } from "@/hooks/useReports";
import { reportsService } from "@/services/reports.service";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reportes")({
  component: ReportesPage,
});

function ReportesPage() {
  const { filters } = useFilters();

  // Fetch reports based on active filters via layered hooks
  const { reports = [], isLoading } = useReports(filters);

  // Calculate dynamic zones from current reports
  const zonesMap: Record<string, { alerts: number; verified: number; color: string }> = {};
  const colors = [
    "bg-sky-400",
    "bg-amber-400",
    "bg-violet-400",
    "bg-rose-400",
    "bg-orange-300",
    "bg-emerald-400",
  ];

  reports.forEach((r) => {
    const zoneName = r.zone || "Zona desconocida";
    if (!zonesMap[zoneName]) {
      const colorIndex = Object.keys(zonesMap).length % colors.length;
      zonesMap[zoneName] = { alerts: 0, verified: 0, color: colors[colorIndex] };
    }
    zonesMap[zoneName].alerts += 1;
    if (r.verified) {
      zonesMap[zoneName].verified += 1;
    }
  });

  const activeZones = Object.entries(zonesMap).map(([name, data]) => ({
    name,
    ...data,
  }));

  // CSV Export handler calling service layer
  const handleExportCSV = () => {
    if (reports.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    try {
      const csvContent = reportsService.exportToCSV(reports);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `reporte_alertas_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV descargado con éxito.");
    } catch (err: any) {
      toast.error("Error al generar el archivo CSV: " + err.message);
    }
  };

  // PDF / Print handler
  const handleExportPDF = () => {
    if (reports.length === 0) {
      toast.error("No hay datos para imprimir");
      return;
    }
    window.print();
  };

  return (
    <div className="print:p-0">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 print:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Exportaciones
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Generación de reportes
          </h1>
          <p className="text-muted-foreground text-sm">
            Filtra y exporta datos administrativos reales a formato de hoja de cálculo o documento impreso.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            variant="secondary"
            className="rounded-xl gap-2 border border-border cursor-pointer"
          >
            <FileSpreadsheet className="size-4" />
            CSV
          </Button>
          <Button
            onClick={handleExportPDF}
            className="rounded-xl gap-2 font-bold cursor-pointer"
          >
            <FileText className="size-4" />
            Imprimir / PDF
          </Button>
        </div>
      </div>

      <Link
        to="/admin/panel"
        className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 mb-6 transition-colors print:hidden"
      >
        <ArrowLeft className="size-4" />
        Volver al panel
      </Link>

      {/* Zonas activas widgets */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 print:hidden">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
            Cargando estadísticas de zona...
          </div>
        ) : activeZones.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
            Sin incidentes para mostrar métricas por zona.
          </div>
        ) : (
          activeZones.slice(0, 6).map((z) => (
            <div
              key={z.name}
              className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-primary/40 transition-colors"
            >
              <div className={`size-12 rounded-full ${z.color} opacity-80 shrink-0`} />
              <div className="min-w-0">
                <div className="font-display font-bold text-sm truncate">{z.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {z.alerts} alertas · {z.verified} verificadas
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main Preview Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden print:border-0 print:bg-transparent">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between print:hidden">
          <h3 className="font-display font-bold text-sm">Vista previa de exportación</h3>
          <span className="text-xs text-muted-foreground">
            {reports.length} resultados · según filtros activos
          </span>
        </div>
        
        {/* Print Header (Only visible when printing) */}
        <div className="hidden print:block mb-8">
          <div className="flex items-center justify-between border-b border-gray-300 pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">REPORTES DE INCIDENTES URBANS</h1>
              <p className="text-xs text-gray-500 mt-1">Plataforma Ciudadana de Seguridad - Alertas</p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>Fecha: {new Date().toLocaleDateString()}</div>
              <div>Registros totales: {reports.length}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs bg-gray-100 p-4 rounded-lg mb-6">
            <div><strong>Filtro Categoría:</strong> {filters.category || "Todos"}</div>
            <div><strong>Filtro Estado:</strong> {filters.status || "Todos"}</div>
            <div><strong>Filtro Zona:</strong> {filters.zone || "Todas"}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 flex items-center justify-center text-xs text-muted-foreground gap-2">
              <Loader2 className="size-4 animate-spin" />
              Cargando registros reales...
            </div>
          ) : reports.length === 0 ? (
            <div className="py-20 text-center text-xs text-muted-foreground">
              No hay incidentes que coincidan con los filtros para exportar.
            </div>
          ) : (
            <table className="w-full text-sm print:text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border bg-muted/20 print:bg-gray-100 print:text-gray-800">
                  <th className="text-left px-6 py-3">ID</th>
                  <th className="text-left px-3 py-3">Tipo</th>
                  <th className="text-left px-3 py-3">Zona</th>
                  <th className="text-left px-3 py-3">Estado</th>
                  <th className="text-left px-3 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors print:border-gray-200"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                      #{row.id}
                    </td>
                    <td className="px-3 py-3 font-medium">{row.type?.name || "Desconocido"}</td>
                    <td className="px-3 py-3 text-muted-foreground">{row.zone}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${
                          row.verified ? "text-emerald-400 print:text-emerald-600" : "text-amber-400 print:text-amber-600"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            row.verified ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                        />
                        {row.verified ? "Verificado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}