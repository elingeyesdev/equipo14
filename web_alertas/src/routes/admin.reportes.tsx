import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Clock,
  Calendar,
  User,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/DataTable";
import { useReportsWithDeleted } from "@/hooks/useReports";
import { reportsService } from "@/services/reports.service";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ImageCarouselDialog } from "@/components/admin/ImageCarouselDialog";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { ActionConfirmDialog } from "@/components/admin/ActionConfirmDialog";
import { ReportLocationMap } from "@/components/admin/ReportLocationMap";
import type { Report, ReportImage } from "@/domain/types";

export const Route = createFileRoute("/admin/reportes")({
  head: () => ({
    meta: [
      { title: "Listado de Alertas · Avispáte" },
      { name: "description", content: "Administración y exportación de alertas e incidentes." },
    ],
  }),
  component: ReportesPage,
});

function ReportesPage() {
  const {
    reports = [],
    isLoading,
    verifyReport,
    isVerifying,
    deleteReport,
    isDeleting,
    reactivateReport,
    isReactivating,
  } = useReportsWithDeleted();
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [confirmVerifyOpen, setConfirmVerifyOpen] = useState(false);
  const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
  
  // Image Carousel state
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselImages, setCarouselImages] = useState<ReportImage[]>([]);
  const [carouselInitialIndex, setCarouselInitialIndex] = useState(0);
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);



  // Stats calculation
  const totalCount = reports.length;
  const activeCount = reports.filter((r) => r.status === "activo").length;
  const resolvedCount = reports.filter((r) => r.status === "resuelto").length;
  const inactiveCount = reports.filter((r) => r.status === "vencido" || r.status === "eliminado").length;

  const statCards = [
    { label: "Total de Alertas", value: totalCount.toString(), borderClass: "border-t-blue-500/80", dotClass: "bg-blue-500" },
    { label: "Alertas Activas", value: activeCount.toString(), borderClass: "border-t-emerald-500/80", dotClass: "bg-emerald-500" },
    { label: "Resueltas", value: resolvedCount.toString(), borderClass: "border-t-sky-500/80", dotClass: "bg-sky-500" },
    { label: "Expiradas / Eliminadas", value: inactiveCount.toString(), borderClass: "border-t-rose-500/80", dotClass: "bg-rose-500" },
  ];

  const statusBadgeClass = (status?: string) => {
    switch (status) {
      case "activo":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
      case "resuelto":
        return "bg-sky-500/10 text-sky-400 border-sky-500/25";
      case "vencido":
        return "bg-amber-500/10 text-amber-400 border-amber-500/25";
      case "eliminado":
        return "bg-destructive/10 text-destructive border-destructive/25";
      default:
        return "bg-muted/40 text-muted-foreground border-border";
    }
  };

  const statusLabel = (status?: string) => {
    switch (status) {
      case "activo":
        return "Activo";
      case "resuelto":
        return "Resuelto";
      case "vencido":
        return "Vencido";
      case "eliminado":
        return "Eliminado";
      default:
        return status || "Desconocido";
    }
  };

  const dispatchBadgeClass = (state?: string) => {
    switch (state) {
      case "en_curso":
        return "bg-blue-500/10 text-blue-400 border-blue-500/25";
      case "completado":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
      case "cancelado":
        return "bg-rose-500/10 text-rose-400 border-rose-500/25";
      default:
        return "bg-muted/40 text-muted-foreground border-border";
    }
  };

  const dispatchLabel = (state?: string) => {
    switch (state) {
      case "en_curso":
        return "En curso";
      case "completado":
        return "Completado";
      case "cancelado":
        return "Cancelado";
      default:
        return state || "Desconocido";
    }
  };

  const columns: ColumnDef<Report>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ getValue }) => <span className="font-mono text-xs text-muted-foreground">{getValue() as number}</span>,
    },
    {
      id: "type",
      header: "Tipo",
      accessorFn: (row) => row.type?.name ?? "Desconocido",
      cell: ({ row }) => <span className="font-semibold">{row.original.type?.name || "Desconocido"}</span>,
    },
    {
      accessorKey: "zone",
      header: "Zona",
      cell: ({ getValue }) => <span className="text-muted-foreground">{getValue() as string}</span>,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ getValue }) => {
        const val = getValue() as string;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${statusBadgeClass(val)}`}>
            {statusLabel(val)}
          </span>
        );
      },
    },
    {
      id: "verified",
      header: "Verificación",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
            row.original.verified ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          <span className={`size-1.5 rounded-full ${row.original.verified ? "bg-emerald-400" : "bg-amber-400"}`} />
          {row.original.verified ? "Verificado" : "Pendiente"}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Fecha de Reporte",
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground font-mono">
          {new Date(getValue() as string).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="print:p-0">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 print:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Administración
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Listado de Alertas
          </h1>
          <p className="text-muted-foreground text-sm">
            Visualiza y administra todos los reportes de incidentes ciudadanos registrados.
          </p>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 print:hidden">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`bg-card/40 border border-border border-t-4 ${card.borderClass} p-5 rounded-none`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {card.label}
              </span>
              <span className={`size-1.5 rounded-none animate-pulse ${card.dotClass}`} />
            </div>
            <div className="text-2xl font-mono font-bold text-foreground">
              {isLoading ? "..." : card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-card border border-border rounded-none overflow-hidden print:border-0 print:bg-transparent">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between print:hidden bg-muted/10">
          <h3 className="font-display font-bold text-sm">Historial de Incidentes</h3>
          <span className="text-xs text-muted-foreground font-mono">
            {reports.length} reportes cargados
          </span>
        </div>

        <DataTable
          columns={columns}
          data={reports}
          isLoading={isLoading}
          onRowClick={(row) => setSelectedReport(row)}
          emptyMessage="No se encontraron reportes registrados."
        />
      </div>

      {/* Detail Slide-out Sheet */}
      <Sheet open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <SheetContent className="w-full sm:max-w-xl rounded-none sm:rounded-none overflow-y-auto flex flex-col p-6">
          {selectedReport && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    ALERTA {selectedReport.id}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${statusBadgeClass(selectedReport.status)}`}>
                    {statusLabel(selectedReport.status)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                      selectedReport.verified ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${selectedReport.verified ? "bg-emerald-400" : "bg-amber-400"}`} />
                    {selectedReport.verified ? "Verificado" : "Pendiente"}
                  </span>
                </div>
                <SheetTitle className="font-display text-2xl font-bold">
                  {selectedReport.type?.name || "Incidente"}
                </SheetTitle>
                <SheetDescription className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap bg-muted/30 p-4 border border-border font-sans">
                  {selectedReport.description || "Sin descripción adicional proporcionada por el usuario."}
                </SheetDescription>
              </SheetHeader>

              {/* Gallery Section */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                  Evidencia Fotográfica ({selectedReport.images?.length || 0})
                </h4>
                {selectedReport.images?.length ? (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedReport.images.map((img, idx) => (
                      <div
                        key={img.id}
                        onClick={() => {
                          setCarouselImages(selectedReport.images);
                          setCarouselInitialIndex(idx);
                          setCarouselActiveIndex(idx);
                          setCarouselOpen(true);
                        }}
                        className="relative aspect-square border border-border overflow-hidden bg-muted cursor-pointer group"
                      >
                        <img
                          src={img.url}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                          <span className="text-[9px] text-white font-bold uppercase tracking-wider bg-black/75 px-2 py-1 border border-white/10">
                            Ampliar
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-muted/10 py-4 text-center border border-dashed border-border">
                    No se adjuntó evidencia fotográfica para esta alerta.
                  </p>
                )}
              </div>

              {/* Technical Specifications */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Detalles del Reporte
                </h4>
                <div className="border border-border divide-y divide-border text-xs font-mono">
                  <div className="grid grid-cols-3 p-3">
                    <span className="text-muted-foreground uppercase">Zona Urbana</span>
                    <span className="col-span-2 text-foreground font-sans font-semibold">
                      {selectedReport.zone || "Desconocida"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-3">
                    <span className="text-muted-foreground uppercase">Reportado</span>
                    <span className="col-span-2 text-foreground">
                      <Calendar className="size-3.5 inline mr-1 text-muted-foreground" />
                      {new Date(selectedReport.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-3">
                    <span className="text-muted-foreground uppercase">Expiración</span>
                    <span className="col-span-2 text-foreground">
                      <Clock className="size-3.5 inline mr-1 text-muted-foreground" />
                      {new Date(selectedReport.expires_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-3">
                    <span className="text-muted-foreground uppercase">Creador ID</span>
                    <span className="col-span-2 text-foreground truncate" title={selectedReport.creator}>
                      <User className="size-3.5 inline mr-1 text-muted-foreground" />
                      {selectedReport.creator || "Anónimo / Ciudadano"}
                    </span>
                  </div>
                  {selectedReport.verified_by && (
                    <div className="grid grid-cols-3 p-3">
                      <span className="text-muted-foreground uppercase">Verificador</span>
                      <span className="col-span-2 text-foreground font-sans font-medium">
                        <ShieldAlert className="size-3.5 inline mr-1 text-emerald-400" />
                        {selectedReport.verified_by.first_name} {selectedReport.verified_by.last_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal de Respuesta */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                  Personal de Respuesta ({selectedReport.dispatches?.length || 0})
                </h4>
                {selectedReport.dispatches?.length ? (
                  <div className="border border-border divide-y divide-border text-xs font-mono">
                    {selectedReport.dispatches.map((dispatch, idx) => (
                      <div key={idx} className="p-3 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="font-sans font-semibold text-foreground">
                            {dispatch.attended_by 
                              ? `${dispatch.attended_by.first_name} ${dispatch.attended_by.last_name}` 
                              : "No asignado"}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${dispatchBadgeClass(dispatch.state)} rounded-none`}>
                            {dispatchLabel(dispatch.state)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                          <span>
                            {dispatch.attended_by?.authority_profile?.profile_type 
                              ? `Cargo: ${dispatch.attended_by.authority_profile.profile_type}` 
                              : "Ciudadano/Otros"}
                          </span>
                          <span>
                            {new Date(dispatch.recorded_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-muted/10 py-4 text-center border border-dashed border-border rounded-none">
                    Ningún personal de respuesta asignado aún a esta alerta.
                  </p>
                )}
              </div>

              {/* Geographic Location Map */}
              <div className="mb-6 flex-1 min-h-[220px]">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Ubicación Geográfica
                </h4>
                <ReportLocationMap
                  coordinates={selectedReport.coordinates}
                  categoryName={selectedReport.type?.name}
                  verified={selectedReport.verified}
                  resizeKey={selectedReport.id}
                />
              </div>

              {/* Action Panel Footer */}
              <div className="border-t border-border pt-4 mt-auto">
                <div className="flex gap-2">
                  {!selectedReport.verified && selectedReport.status === "activo" && (
                    <Button
                      onClick={() => setConfirmVerifyOpen(true)}
                      disabled={isVerifying}
                      className="flex-1 rounded-none font-bold gap-1 cursor-pointer text-xs"
                    >
                      {isVerifying ? "Verificando..." : "Confirmar Veracidad"}
                    </Button>
                  )}

                  {selectedReport.status !== "activo" && (
                    <Button
                      onClick={() => setConfirmReactivateOpen(true)}
                      disabled={isReactivating}
                      className="flex-1 rounded-none font-bold gap-1 cursor-pointer text-xs"
                    >
                      {isReactivating ? "Reactivando..." : "Reactivar Alerta"}
                    </Button>
                  )}

                  {selectedReport.status !== "eliminado" && (
                    <Button
                      onClick={() => setDeleteTargetId(selectedReport.id)}
                      disabled={isDeleting}
                      variant="destructive"
                      className="rounded-none font-bold gap-1 cursor-pointer text-xs"
                    >
                      {isDeleting ? "Eliminando..." : "Eliminar"}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        onConfirm={async () => {
          if (deleteTargetId !== null) {
            try {
              await deleteReport(deleteTargetId);
              toast.success("Alerta eliminada correctamente.");
              if (selectedReport?.id === deleteTargetId) {
                setSelectedReport((prev) => prev ? { ...prev, status: "eliminado" } : null);
              }
            } catch (err: any) {
              toast.error(err.message || "Error al eliminar la alerta.");
            } finally {
              setDeleteTargetId(null);
            }
          }
        }}
        isLoading={isDeleting}
      />

      {/* Lightbox / Image Viewer */}
      <ImageCarouselDialog
        images={carouselImages}
        initialIndex={carouselInitialIndex}
        open={carouselOpen}
        onOpenChange={setCarouselOpen}
        activeIndex={carouselActiveIndex}
        setActiveIndex={setCarouselActiveIndex}
      />

      <ActionConfirmDialog
        open={confirmVerifyOpen}
        onOpenChange={setConfirmVerifyOpen}
        onConfirm={async () => {
          if (selectedReport) {
            try {
              await verifyReport(selectedReport.id);
              toast.success("Alerta verificada con éxito.");
              setSelectedReport((prev) => prev ? { ...prev, verified: true } : null);
            } catch (err: any) {
              toast.error(err.message || "Error al verificar la alerta.");
            } finally {
              setConfirmVerifyOpen(false);
            }
          }
        }}
        isLoading={isVerifying}
        title="¿Confirmar veracidad?"
        description="Esta acción marcará el reporte como verificado y alertará al personal de respuesta correspondiente."
        confirmText="Confirmar"
        icon={<ShieldAlert className="size-5 text-primary" />}
      />

      <ActionConfirmDialog
        open={confirmReactivateOpen}
        onOpenChange={setConfirmReactivateOpen}
        onConfirm={async () => {
          if (selectedReport) {
            try {
              await reactivateReport(selectedReport.id);
              toast.success("Alerta reactivada con éxito.");
              setSelectedReport((prev) => prev ? { ...prev, status: "activo" } : null);
            } catch (err: any) {
              toast.error(err.message || "Error al reactivar la alerta.");
            } finally {
              setConfirmReactivateOpen(false);
            }
          }
        }}
        isLoading={isReactivating}
        title="¿Reactivar alerta?"
        description="Esta acción cambiará el estado de la alerta a 'Activo' y extenderá su tiempo de expiración."
        confirmText="Reactivar"
        icon={<Clock className="size-5 text-primary" />}
      />
    </div>
  );
}