import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Building2, PlusCircle, MapPin, Edit3, Trash2 } from "lucide-react";
import { useEmergencyStations } from "@/hooks/useEmergencyStations";
import { stationLabel } from "@/lib/emergency-station";
import { CreateEmergencyStationSheet } from "@/components/admin/CreateEmergencyStationSheet";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/DataTable";
import { ReportLocationMap } from "@/components/admin/ReportLocationMap";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActionConfirmDialog } from "@/components/admin/ActionConfirmDialog";
import { toast } from "sonner";
import type { EmergencyStation } from "@/domain/types";

export const Route = createFileRoute("/admin/estaciones")({
  head: () => ({
    meta: [
      { title: "Estaciones de Emergencia · Avispáte" },
      { name: "description", content: "Administración y creación de estaciones de policía, bomberos y hospitales." },
    ],
  }),
  component: EstacionesPage,
});

function EstacionesPage() {
  const {
    stations = [],
    isLoading,
    refetch,
    updateStation,
    isUpdating,
    deleteStation,
    isDeleting,
  } = useEmergencyStations();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<EmergencyStation | null>(null);
  const [searchName, setSearchName] = useState("");
  const [editStation, setEditStation] = useState<EmergencyStation | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const filteredStations = stations.filter((s) => {
    if (!searchName.trim()) return true;
    return s.name.toLowerCase().includes(searchName.trim().toLowerCase());
  });

  const totalCount = stations.length;
  const policiaCount = stations.filter((s) => s.installation_type === "policia").length;
  const bomberoCount = stations.filter((s) => s.installation_type === "bombero").length;
  const hospitalCount = stations.filter((s) => s.installation_type === "hospital").length;

  const cards = [
    { label: "Total Estaciones", value: totalCount.toString(), borderClass: "border-t-slate-500/80", dotClass: "bg-slate-500" },
    { label: "Policías", value: policiaCount.toString(), borderClass: "border-t-blue-500/80", dotClass: "bg-blue-500" },
    { label: "Bomberos", value: bomberoCount.toString(), borderClass: "border-t-red-500/80", dotClass: "bg-red-500" },
    { label: "Hospitales", value: hospitalCount.toString(), borderClass: "border-t-emerald-500/80", dotClass: "bg-emerald-500" },
  ];

  const typeBadgeClass = (type: string) => {
    switch (type) {
      case "policia":
        return "bg-blue-500/10 text-blue-400 border-blue-500/25";
      case "bombero":
        return "bg-red-500/10 text-red-400 border-red-500/25";
      case "hospital":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
      default:
        return "bg-muted/40 text-muted-foreground border-border";
    }
  };

  const columns: ColumnDef<EmergencyStation>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ getValue }) => <span className="font-mono text-xs text-muted-foreground">{getValue() as number}</span>,
    },
    {
      accessorKey: "name",
      header: "Nombre de la estación",
      cell: ({ getValue }) => <span className="font-semibold">{getValue() as string}</span>,
    },
    {
      accessorKey: "installation_type",
      header: "Tipo de servicio",
      cell: ({ getValue }) => {
        const val = getValue() as string;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${typeBadgeClass(val)}`}>
            {stationLabel(val)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditStation(row.original);
              setEditName(row.original.name);
            }}
            title="Editar nombre"
            className="size-8 rounded-none border border-border hover:border-primary hover:text-primary grid place-items-center transition-colors cursor-pointer"
          >
            <Edit3 className="size-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTargetId(row.original.id);
            }}
            title="Eliminar"
            className="size-8 rounded-none border border-border hover:border-destructive hover:text-destructive grid place-items-center transition-colors cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Recursos y Respuesta
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Estaciones de Emergencia
          </h1>
          <p className="text-muted-foreground text-sm">
            Administra las estaciones de policía, cuarteles de bomberos y centros médicos registrados en el sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)} className="rounded-none gap-2 font-bold cursor-pointer">
            <PlusCircle className="size-4" />
            Nueva estación
          </Button>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`bg-card/40 border border-border border-t-4 ${c.borderClass} p-5 rounded-none shadow-lg`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                {c.label}
              </span>
              <span className={`size-1.5 rounded-none animate-pulse ${c.dotClass}`} />
            </div>
            <div className="font-display text-2xl font-mono font-bold leading-none">
              {isLoading ? "..." : c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Search Input */}
      <div className="mb-6 max-w-sm">
        <label htmlFor="search-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
          Buscar por nombre
        </label>
        <input
          id="search-name"
          type="text"
          placeholder="Ingresa el nombre de la estación..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="w-full bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-primary rounded-none font-sans"
        />
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border rounded-none overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/10">
          <h3 className="font-display font-bold text-sm">Estaciones Registradas</h3>
          <span className="text-xs text-muted-foreground font-mono">
            {filteredStations.length} estaciones mostradas
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filteredStations}
          isLoading={isLoading}
          onRowClick={setSelectedStation}
          emptyMessage="No se encontraron estaciones de emergencia."
        />
      </div>

      {/* Location Dialog on Row Click */}
      <Dialog open={!!selectedStation} onOpenChange={(open) => !open && setSelectedStation(null)}>
        <DialogContent className="sm:max-w-xl rounded-none sm:rounded-none">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              {selectedStation && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${typeBadgeClass(selectedStation.installation_type)}`}>
                  {stationLabel(selectedStation.installation_type)}
                </span>
              )}
            </div>
            <DialogTitle className="font-display text-xl font-bold">
              {selectedStation?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Vista de ubicación geográfica de la estación de respuesta.
            </DialogDescription>
          </DialogHeader>
          {selectedStation && (
            <div className="space-y-4">
              <div className="border border-border rounded-none overflow-hidden h-[300px]">
                <ReportLocationMap
                  coordinates={selectedStation.coordinates}
                  categoryName={stationLabel(selectedStation.installation_type)}
                  verified={true}
                  resizeKey={selectedStation.id}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CreateEmergencyStationSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => refetch?.()}
      />

      {/* Edit Station Name Dialog */}
      <Dialog open={!!editStation} onOpenChange={(open) => !open && setEditStation(null)}>
        <DialogContent className="sm:max-w-md rounded-none sm:rounded-none bg-background border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Editar Estación</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modifica el nombre de la estación de emergencia.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editName.trim()) {
                toast.error("El nombre no puede estar vacío");
                return;
              }
              setConfirmEditOpen(true);
            }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <label htmlFor="edit-station-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                Nombre de la estación
              </label>
              <input
                id="edit-station-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-primary rounded-none font-sans"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditStation(null)}
                className="rounded-none cursor-pointer text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-none cursor-pointer text-xs font-bold"
              >
                Guardar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ActionConfirmDialog for Edit */}
      <ActionConfirmDialog
        open={confirmEditOpen}
        onOpenChange={setConfirmEditOpen}
        onConfirm={async () => {
          if (editStation && editName.trim()) {
            try {
              await updateStation({ id: editStation.id, name: editName.trim() });
              toast.success("Estación actualizada exitosamente.");
              setEditStation(null);
            } catch (err: any) {
              toast.error(err.message || "Error al actualizar la estación");
            } finally {
              setConfirmEditOpen(false);
            }
          }
        }}
        isLoading={isUpdating}
        title="¿Guardar cambios?"
        description="Esta acción actualizará el nombre de la estación de emergencia."
        confirmText="Guardar"
      />

      {/* ActionConfirmDialog for Delete */}
      <ActionConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        onConfirm={async () => {
          if (deleteTargetId !== null) {
            try {
              await deleteStation(deleteTargetId);
              toast.success("Estación de emergencia eliminada.");
              if (selectedStation?.id === deleteTargetId) {
                setSelectedStation(null);
              }
            } catch (err: any) {
              toast.error(err.message || "Error al eliminar la estación");
            } finally {
              setDeleteTargetId(null);
            }
          }
        }}
        isLoading={isDeleting}
        title="¿Eliminar estación de emergencia?"
        description="Esta acción no se puede deshacer. Se aplicará un borrado lógico a la estación de emergencia."
        confirmText="Eliminar"
        variant="destructive"
        icon={<Trash2 className="size-5 text-destructive" />}
      />
    </div>
  );
}
