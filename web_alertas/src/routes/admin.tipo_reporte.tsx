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
import type { ReportType } from "@/domain/types";

export const Route = createFileRoute("/admin/tipo_reporte")({
  component: TipoReportePage,
});

function TipoReportePage() {
  const { reportTypes = [], isLoading, createReportType, deleteReportType, isCreating } = useReportTypes();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

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
          <Button onClick={() => setCreateOpen(true)} className="rounded-none gap-2 font-bold cursor-pointer">
            <PlusCircle className="size-4" />
            Crear nuevo tipo
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={reportTypes}
        isLoading={isLoading}
        emptyMessage="Ningún tipo de reporte encontrado."
        footerText={`${reportTypes.length} tipos de alerta`}
      />

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto border-border rounded-none bg-background">
          <SheetHeader className="mb-0 pr-8 pb-5 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 rounded-none">
                Catálogo
              </span>
            </div>
            <SheetTitle className="font-display text-lg tracking-tight">Nuevo tipo de alerta</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Crea una nueva categoría para que los ciudadanos o autoridades puedan reportar incidentes de esta índole.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreateType} className="space-y-0 pb-8">
            <div className="px-0 py-4 border-b border-border space-y-2">
              <Label htmlFor="type-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Nombre de la categoría
              </Label>
              <Input
                id="type-name"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                required
                placeholder="Ej. Poste caído"
                className="rounded-none border-border"
              />
            </div>
            <div className="pt-5">
              <Button type="submit" disabled={isCreating} className="w-full rounded-none font-bold gap-2 cursor-pointer uppercase tracking-wider text-xs h-11">
                {isCreating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creando tipo...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Crear tipo
                  </>
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
