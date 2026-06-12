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
import { FilterButton } from "@/components/admin/FilterButton";
import {
  applySimpleListFilters,
  countSimpleFilters,
  DEFAULT_SIMPLE_FILTERS,
  SimpleListFilters,
  type SimpleListFiltersState,
} from "@/components/admin/SimpleListFilters";
import type { Role } from "@/domain/types";

export const Route = createFileRoute("/admin/roles")({
  component: RolesPage,
});

function RolesPage() {
  const { roles = [], isLoading, createRole, isCreating } = useRoles();
  const [createOpen, setCreateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SimpleListFiltersState>(DEFAULT_SIMPLE_FILTERS);
  const [newRoleName, setNewRoleName] = useState("");

  const filteredRoles = applySimpleListFilters(roles, filters, (role, search) =>
    role.name.toLowerCase().includes(search),
  );

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
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleBadge(row.original.name)}`}>
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
          <FilterButton activeCount={countSimpleFilters(filters)} onClick={() => setFiltersOpen(true)} />
          <Button onClick={() => setCreateOpen(true)} className="rounded-xl gap-2 font-bold cursor-pointer">
            <PlusCircle className="size-4" />
            Nuevo rol
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredRoles}
        isLoading={isLoading}
        emptyMessage="Ningún rol encontrado."
        footerText={`${filteredRoles.length} roles en el sistema`}
      />

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              Nuevo rol
            </SheetTitle>
            <SheetDescription>
              Crea un nuevo rol para asignar a los usuarios del sistema y controlar sus permisos.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreateRole} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Nombre del rol</Label>
              <Input
                id="role-name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                required
                placeholder="Ej. supervisor"
                className="rounded-xl"
              />
            </div>
            <Button type="submit" disabled={isCreating} className="w-full rounded-xl font-bold gap-2 cursor-pointer mt-6">
              {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Crear rol
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <SimpleListFilters
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Filtros de roles"
        description="Busca roles por nombre."
        filters={filters}
        onChange={setFilters}
        resultCount={filteredRoles.length}
      />
    </div>
  );
}
