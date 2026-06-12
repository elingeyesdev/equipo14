import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Trash2, PlusCircle } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { toast } from "sonner";
import { roleBadgeClass, roleLabel } from "@/lib/roles";
import { CreateAuthoritySheet } from "@/components/admin/CreateAuthoritySheet";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/DataTable";
import { FilterButton } from "@/components/admin/FilterButton";
import {
  applySimpleListFilters,
  countSimpleFilters,
  DEFAULT_SIMPLE_FILTERS,
  SimpleListFilters,
  type SimpleListFiltersState,
} from "@/components/admin/SimpleListFilters";
import type { User } from "@/domain/types";

export const Route = createFileRoute("/admin/usuarios")({
  component: UsuariosPage,
});

function UsuariosPage() {
  const { users = [], isLoading, deleteUser, isDeleting, refetch } = useUsers();
  const [createOpen, setCreateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SimpleListFiltersState>(DEFAULT_SIMPLE_FILTERS);

  const baseUsers = users.filter((u) => u.role?.name?.toLowerCase() !== "admin");
  const filteredUsers = applySimpleListFilters(
    baseUsers,
    filters,
    (user, search) => {
      const haystack = `${user.first_name} ${user.last_name} ${user.phone}`.toLowerCase();
      return haystack.includes(search);
    },
    (user, role) => (user.role?.name ?? "").toLowerCase() === role,
  );

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("¿Estás seguro que deseas eliminar este usuario?")) return;
    try {
      await deleteUser(id);
      toast.success("Usuario eliminado.");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar usuario");
    }
  };

  const totalCount = filteredUsers.length;
  const usuarioCount = filteredUsers.filter((u) => u.role?.name?.toLowerCase() === "usuario").length;
  const autoridadCount = filteredUsers.filter((u) => u.role?.name?.toLowerCase() === "autoridad").length;

  const cards = [
    { label: "Total de usuarios", value: totalCount.toString() },
    { label: "Usuarios normales", value: usuarioCount.toString() },
    { label: "Autoridades", value: autoridadCount.toString() },
  ];

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground truncate block max-w-[110px]">
          {String(getValue()).slice(0, 8)}…
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
      cell: ({ getValue }) => <span className="font-mono">{String(getValue())}</span>,
    },
    {
      id: "fullName",
      header: "Nombre completo",
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      cell: ({ row }) => {
        const auth = row.original.authority_profile;
        return (
          <div className="flex flex-col">
            <span className="font-medium capitalize">
              {row.original.first_name} {row.original.last_name}
            </span>
            {auth && (
              <span className="text-[10px] text-muted-foreground">
                CI: {auth.ci} · {auth.gmail}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "role",
      header: "Rol / Perfil",
      accessorFn: (row) => row.role?.name ?? "",
      cell: ({ row }) => {
        const auth = row.original.authority_profile;
        return (
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleBadgeClass(row.original.role)}`}>
              {roleLabel(row.original.role?.name)}
            </span>
            {auth?.profile_type && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {auth.profile_type === "policia" ? "Policía" : auth.profile_type === "bombero" ? "Bombero" : "Paramédico"}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="flex justify-end">
          <button
            onClick={() => handleDeleteUser(row.original.id)}
            disabled={isDeleting}
            title="Eliminar"
            className="size-8 rounded-lg border border-border hover:border-destructive hover:text-destructive grid place-items-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Gestión de cuentas
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Usuarios del sistema
          </h1>
          <p className="text-muted-foreground text-sm">
            Visualiza y administra a todos los usuarios registrados y autoridades.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterButton activeCount={countSimpleFilters(filters)} onClick={() => setFiltersOpen(true)} />
          <Button onClick={() => setCreateOpen(true)} className="rounded-xl gap-2 font-bold cursor-pointer">
            <PlusCircle className="size-4" />
            Nuevo usuario
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-2xl p-6">
            <div className="font-display text-4xl font-bold text-primary mb-1 leading-none">{c.value}</div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{c.label}</div>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        emptyMessage="Ningún usuario encontrado."
        footerText={`${filteredUsers.length} usuarios mostrados`}
      />

      <CreateAuthoritySheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => refetch?.()}
      />

      <SimpleListFilters
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Filtros de usuarios"
        description="Busca por nombre o teléfono y filtra por rol."
        filters={filters}
        onChange={setFilters}
        showRoleFilter
        resultCount={filteredUsers.length}
      />
    </div>
  );
}
