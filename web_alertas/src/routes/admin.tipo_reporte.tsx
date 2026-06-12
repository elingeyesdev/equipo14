import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, PlusCircle, Tag, Plus } from "lucide-react";
import { useReportTypes } from "@/hooks/useReportTypes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DataTable } from "@/components/admin/DataTable";
import { FilterButton } from "@/components/admin/FilterButton";
import {
  applySimpleListFilters,
  countSimpleFilters,
  DEFAULT_SIMPLE_FILTERS,
  SimpleListFilters,
  type SimpleListFiltersState,
} from "@/components/admin/SimpleListFilters";
import type { ReportType } from "@/domain/types";

export const Route = createFileRoute("/admin/tipo_reporte")({
  component: TipoReportePage,
});

function TipoReportePage() {
  const { reportTypes = [], isLoading, createReportType, deleteReportType, isCreating, isDeleting } = useReportTypes();
  const [createOpen, setCreateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SimpleListFiltersState>(DEFAULT_SIMPLE_FILTERS);
  const [newTypeName, setNewTypeName] = useState("");

  const filteredTypes = applySimpleListFilters(reportTypes, filters, (type, search) =>
    type.name.toLowerCase().includes(search),
  );

  // Logic kept intact for future use
  const handleDeleteType = async (id: number) => {
    if (!window.confirm("¿Estás seguro que deseas eliminar este tipo de reporte?")) return;
    try {
      await deleteReportType(id);
      toast.success("Tipo de reporte eliminado.");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar tipo de reporte");
    }
  };

  const handleCreateType = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    try {
      await createReportType(newTypeName.trim());
      toast.success("Nuevo tipo de reporte creado.");
      setNewTypeName("");
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al crear tipo de reporte");
    }
  };

  const columns: ColumnDef<ReportType>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">{String(getValue())}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Nombre del tipo",
      cell: ({ getValue }) => <span className="font-medium">{String(getValue())}</span>,
    },
    {
      accessorKey: "base_weight",
      header: "Peso base",
      cell: ({ getValue }) => (
        <span className="font-mono text-muted-foreground">{String(getValue())} pts</span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Gestión del catálogo
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Tipos de alerta
          </h1>
          <p className="text-muted-foreground text-sm">
            Visualiza y administra las categorías disponibles para clasificar incidentes en la ciudad.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterButton activeCount={countSimpleFilters(filters)} onClick={() => setFiltersOpen(true)} />
          <Button onClick={() => setCreateOpen(true)} className="rounded-xl gap-2 font-bold cursor-pointer">
            <PlusCircle className="size-4" />
            Crear nuevo tipo
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredTypes}
        isLoading={isLoading}
        emptyMessage="Ningún tipo de reporte encontrado."
        footerText={`${filteredTypes.length} tipos de alerta`}
      />

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display flex items-center gap-2">
              <Tag className="size-5 text-primary" />
              Nuevo tipo de alerta
            </SheetTitle>
            <SheetDescription>
              Crea una nueva categoría para que los ciudadanos o autoridades puedan reportar incidentes de esta índole.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreateType} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type-name">Nombre de la categoría</Label>
              <Input
                id="type-name"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                required
                placeholder="Ej. Poste caído"
                className="rounded-xl"
              />
            </div>
            <Button type="submit" disabled={isCreating} className="w-full rounded-xl font-bold gap-2 cursor-pointer mt-6">
              {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Crear tipo
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <SimpleListFilters
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Filtros de tipos de alerta"
        description="Busca categorías por nombre."
        filters={filters}
        onChange={setFilters}
        resultCount={filteredTypes.length}
      />
    </div>
  );
}
