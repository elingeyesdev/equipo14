import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, PlusCircle, Shield, Plus } from "lucide-react";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DataTable } from "@/components/admin/DataTable";
import type { Role } from "@/domain/types";

export const Route = createFileRoute("/admin/roles")({
  component: RolesPage,
});

function RolesPage() {
  const { roles = [], isLoading, createRole, isCreating } = useRoles();
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const handleCreateRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    try {
      await createRole(newRoleName.trim());
      toast.success("Rol creado correctamente.");
      setNewRoleName("");
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al crear el rol");
    }
  };

  const roleBadge = (name: string) => {
    const n = name.toLowerCase();
    if (n === "admin") return "bg-violet-500/15 text-violet-300 border border-violet-500/30";
    if (n === "autoridad") return "bg-primary/20 text-primary border border-primary/30";
    return "bg-muted text-muted-foreground border border-border";
  };

  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">{String(getValue())}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Nombre del rol",
      cell: ({ getValue }) => (
        <span className="font-medium capitalize">{String(getValue())}</span>
      ),
    },
    {
      id: "access",
      header: "Nivel de acceso",
      accessorFn: (row) => row.name,
      enableSorting: false,
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider ${roleBadge(row.original.name)}`}>
          {row.original.name}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Gestión del sistema
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Roles
          </h1>
          <p className="text-muted-foreground text-sm">
            Administra los roles disponibles en el sistema para controlar los niveles de acceso.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)} className="rounded-none gap-2 font-bold cursor-pointer">
            <PlusCircle className="size-4" />
            Nuevo rol
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={roles}
        isLoading={isLoading}
        emptyMessage="Ningún rol encontrado."
        footerText={`${roles.length} roles en el sistema`}
      />

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto border-border rounded-none bg-background">
          <SheetHeader className="mb-0 pr-8 pb-5 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 rounded-none">
                Seguridad
              </span>
            </div>
            <SheetTitle className="font-display text-lg tracking-tight">Nuevo rol</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Crea un nuevo rol para asignar a los usuarios del sistema y controlar sus permisos.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreateRole} className="space-y-0 pb-8">
            <div className="px-0 py-4 border-b border-border space-y-2">
              <Label htmlFor="role-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Nombre del rol
              </Label>
              <Input
                id="role-name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                required
                placeholder="Ej. supervisor"
                className="rounded-none border-border"
              />
            </div>
            <div className="pt-5">
              <Button type="submit" disabled={isCreating} className="w-full rounded-none font-bold gap-2 cursor-pointer uppercase tracking-wider text-xs h-11">
                {isCreating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creando rol...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Crear rol
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
